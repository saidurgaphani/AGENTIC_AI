from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from backend.app.config import settings
from backend.app.api.v1 import (
    health,
    network,
    dataset,
    scenarios,
    runs,
    plans,
    audit,
    overview,
    evaluations,
    constraints,
    agents,
    auth_routes,
    supply_chain,
)

from contextlib import asynccontextmanager

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Ensure tables exist in database on startup
    try:
        from backend.app.database import engine, Base
        import backend.app.models  # ensure all models are registered
        Base.metadata.create_all(bind=engine)
    except Exception as e:
        print(f"[STARTUP] Table creation notice: {e}")
    yield

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description="Authoritative REST API for AI Agents for Resilient Supply Chain Manufacturing POC.",
    lifespan=lifespan,
)

# Secure CORS configuration
origins = [
    "http://localhost:3000",
    "http://localhost:3005",
    "http://127.0.0.1:3000",
    "http://127.0.0.1:3005",
    "https://agentic-ai.vercel.app",
    "https://agentic-ai-kd9m.onrender.com",
]

if settings.CORS_ORIGINS:
    for origin in settings.CORS_ORIGINS.split(","):
        cleaned = origin.strip().rstrip("/")
        if cleaned and cleaned not in origins:
            origins.append(cleaned)

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_origin_regex=r"^https://.*\.vercel\.app$|^https://.*\.onrender\.com$|^http://(localhost|127\.0\.0\.1)(:[0-9]+)?$",
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS", "HEAD"],
    allow_headers=["*"],
    expose_headers=["*"],
)

# Exception handlers
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    return JSONResponse(
        status_code=500,
        content={
            "status": "error",
            "error": {
                "code": "INTERNAL_SERVER_ERROR",
                "message": str(exc),
            },
        },
    )

# Include routers under /api/v1 prefix
api_v1_prefix = settings.API_V1_STR

app.include_router(health.router, prefix=api_v1_prefix)
app.include_router(overview.router, prefix=api_v1_prefix)
app.include_router(network.router, prefix=api_v1_prefix)
app.include_router(dataset.router, prefix=api_v1_prefix)
app.include_router(scenarios.router, prefix=api_v1_prefix)
app.include_router(evaluations.router, prefix=api_v1_prefix)
app.include_router(runs.router, prefix=api_v1_prefix)
app.include_router(plans.router, prefix=api_v1_prefix)
app.include_router(audit.router, prefix=api_v1_prefix)
app.include_router(constraints.router, prefix=api_v1_prefix)
app.include_router(agents.router, prefix=api_v1_prefix)
app.include_router(auth_routes.router, prefix=api_v1_prefix)
app.include_router(supply_chain.router, prefix=api_v1_prefix)

# Shared route at /api/supply-chain
app.include_router(supply_chain.router, prefix="/api")

@app.get("/")
@app.head("/")
def root():
    return {
        "project": settings.PROJECT_NAME,
        "version": settings.VERSION,
        "docs_url": "/docs",
        "api_v1": api_v1_prefix,
        "source_of_truth": "Neon PostgreSQL",
    }
