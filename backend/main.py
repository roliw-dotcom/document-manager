from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from config import settings
from routers import documents

app = FastAPI(
    title="Document Manager API",
    version="0.1.0",
    description="Upload and automatically categorize PDF documents.",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(documents.router)


@app.get("/health", tags=["meta"])
def health_check():
    return {"status": "ok"}
