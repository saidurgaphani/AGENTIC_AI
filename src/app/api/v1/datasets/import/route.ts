import { NextRequest, NextResponse } from 'next/server';
import { query, logAuditEvent } from '@/lib/db';

interface RowError {
  row: number;
  column: string;
  value: any;
  message: string;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      entityType, // 'products' | 'suppliers' | 'facilities' | 'distribution_centers' | 'transport_lanes'
      csvContent,
      dryRun = true,
      versionTag,
      description,
    } = body;

    if (!entityType || !csvContent) {
      return NextResponse.json(
        { error: 'entityType and csvContent are required' },
        { status: 400 }
      );
    }

    // 1. Parse CSV Content
    const lines = csvContent
      .trim()
      .split('\n')
      .map((l: string) => l.trim())
      .filter((l: string) => l.length > 0);

    if (lines.length < 2) {
      return NextResponse.json(
        {
          valid: false,
          errors: [
            {
              row: 0,
              column: 'header',
              value: '',
              message: 'CSV must contain a header line and at least one data row',
            },
          ],
        },
        { status: 400 }
      );
    }

    const headers = lines[0].split(',').map((h: string) => h.trim().toLowerCase());
    const dataRows = lines.slice(1);

    // 2. Validate Headers by Entity Type
    const expectedHeaders: Record<string, string[]> = {
      products: ['sku', 'name', 'type', 'standard_cost'],
      suppliers: ['code', 'name', 'location', 'criticality'],
      facilities: ['name', 'location', 'produced_sku', 'daily_capacity', 'daily_operating_cost'],
      distribution_centers: ['code', 'name', 'location', 'service_tier', 'target_sla_percent'],
      transport_lanes: ['origin_id', 'destination_id', 'mode', 'transit_days', 'cost_per_unit'],
    };

    const required = expectedHeaders[entityType];
    if (!required) {
      return NextResponse.json(
        { error: `Unsupported entity type "${entityType}" for import` },
        { status: 400 }
      );
    }

    const missingHeaders = required.filter((rh) => !headers.includes(rh));
    if (missingHeaders.length > 0) {
      return NextResponse.json(
        {
          valid: false,
          errors: [
            {
              row: 1,
              column: 'header',
              value: lines[0],
              message: `Missing required columns: ${missingHeaders.join(', ')}`,
            },
          ],
        },
        { status: 400 }
      );
    }

    // 3. Row-level validation
    const errors: RowError[] = [];
    const parsedRecords: any[] = [];
    const seenPrimaryKeys = new Set<string>();

    for (let i = 0; i < dataRows.length; i++) {
      const rowNum = i + 2; // line number (1-based, after header)
      const values = dataRows[i].split(',').map((v: string) => v.trim());
      const rowObj: Record<string, any> = {};

      headers.forEach((h: string, idx: number) => {
        rowObj[h] = values[idx] !== undefined ? values[idx] : '';
      });

      // Type-specific field validations
      if (entityType === 'products') {
        const sku = rowObj['sku'];
        if (!sku) {
          errors.push({ row: rowNum, column: 'sku', value: sku, message: 'SKU cannot be empty' });
        } else if (seenPrimaryKeys.has(sku)) {
          errors.push({ row: rowNum, column: 'sku', value: sku, message: `Duplicate SKU "${sku}" within import file` });
        } else {
          seenPrimaryKeys.add(sku);
        }

        const name = rowObj['name'];
        if (!name) {
          errors.push({ row: rowNum, column: 'name', value: name, message: 'Product name cannot be empty' });
        }

        const type = rowObj['type']?.toUpperCase();
        if (type !== 'COMPONENT' && type !== 'FINISHED_GOOD') {
          errors.push({
            row: rowNum,
            column: 'type',
            value: rowObj['type'],
            message: 'Type must be either "COMPONENT" or "FINISHED_GOOD"',
          });
        }

        const cost = parseFloat(rowObj['standard_cost']);
        if (isNaN(cost) || cost < 0) {
          errors.push({
            row: rowNum,
            column: 'standard_cost',
            value: rowObj['standard_cost'],
            message: 'standard_cost must be a non-negative number',
          });
        }

        parsedRecords.push({
          id: `prod-${Date.now().toString(36)}-${i}`,
          sku: sku?.toUpperCase(),
          name,
          type,
          uom: rowObj['uom'] || 'units',
          standard_cost: isNaN(cost) ? 0 : cost,
        });
      } else if (entityType === 'suppliers') {
        const code = rowObj['code']?.toUpperCase();
        if (!code) {
          errors.push({ row: rowNum, column: 'code', value: code, message: 'Code cannot be empty' });
        } else if (seenPrimaryKeys.has(code)) {
          errors.push({ row: rowNum, column: 'code', value: code, message: `Duplicate supplier code "${code}"` });
        } else {
          seenPrimaryKeys.add(code);
        }

        const criticality = rowObj['criticality']?.toUpperCase();
        if (!['CRITICAL', 'SECONDARY', 'ALTERNATE'].includes(criticality)) {
          errors.push({
            row: rowNum,
            column: 'criticality',
            value: rowObj['criticality'],
            message: 'Criticality must be CRITICAL, SECONDARY, or ALTERNATE',
          });
        }

        parsedRecords.push({
          id: `sup-${Date.now().toString(36)}-${i}`,
          code,
          name: rowObj['name'],
          location: rowObj['location'],
          criticality,
          active: true,
          disrupted: false,
        });
      }
    }

    const isValid = errors.length === 0;

    // If dry run, return validation report only
    if (dryRun) {
      return NextResponse.json({
        valid: isValid,
        rowCount: dataRows.length,
        errors,
        preview: parsedRecords.slice(0, 5),
        message: isValid
          ? `Validation successful: ${parsedRecords.length} records ready for transactional commit.`
          : `Validation failed with ${errors.length} error(s). Please review and correct.`,
      });
    }

    // 4. Transactional Commit if not dryRun and valid
    if (!isValid) {
      return NextResponse.json(
        {
          valid: false,
          error: 'Cannot commit invalid dataset. Resolve row-level errors first.',
          errors,
        },
        { status: 422 }
      );
    }

    // Insert records
    if (entityType === 'products') {
      for (const p of parsedRecords) {
        await query(
          `INSERT INTO products (id, sku, name, type, uom, standard_cost, active, created_at, updated_at)
           VALUES ($1, $2, $3, $4, $5, $6, true, NOW(), NOW())
           ON CONFLICT (sku) DO UPDATE 
           SET name = EXCLUDED.name, 
               type = EXCLUDED.type, 
               standard_cost = EXCLUDED.standard_cost, 
               updated_at = NOW()`,
          [p.id, p.sku, p.name, p.type, p.uom, p.standard_cost]
        );
      }
    } else if (entityType === 'suppliers') {
      for (const s of parsedRecords) {
        await query(
          `INSERT INTO suppliers (id, code, name, location, criticality, active, disrupted, created_at, updated_at)
           VALUES ($1, $2, $3, $4, $5, $6, false, NOW(), NOW())
           ON CONFLICT (code) DO UPDATE 
           SET name = EXCLUDED.name, 
               location = EXCLUDED.location, 
               criticality = EXCLUDED.criticality, 
               updated_at = NOW()`,
          [s.id, s.code, s.name, s.location, s.criticality, s.active]
        );
      }
    }

    // Register new dataset version
    const newVersionId = `ver-${Date.now().toString(36)}`;
    const versionString = versionTag || `v${Date.now().toString().slice(-4)}`;
    await query(
      `INSERT INTO dataset_versions (id, version, name, seed, manifest, imported_at, status)
       VALUES ($1, $2, $3, $4, $5, NOW(), 'ACTIVE')`,
      [
        newVersionId,
        versionString,
        description || `Import of ${parsedRecords.length} ${entityType} records`,
        `SEED_${Date.now()}`,
        JSON.stringify({
          entityType,
          importedRows: parsedRecords.length,
          timestamp: new Date().toISOString(),
        }),
      ]
    );

    await logAuditEvent({
      eventType: 'DATASET_IMPORT',
      targetEntity: 'dataset_versions',
      targetId: newVersionId,
      details: `Committed ${parsedRecords.length} records into ${entityType} under version ${versionString}`,
      afterState: { newVersionId, versionString, rowCount: parsedRecords.length },
    });

    return NextResponse.json({
      success: true,
      newVersionId,
      versionString,
      rowsImported: parsedRecords.length,
      message: `Successfully imported and committed ${parsedRecords.length} records into database.`,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: 'Import processing failed', details: error.message },
      { status: 500 }
    );
  }
}
