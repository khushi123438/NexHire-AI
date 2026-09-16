import os
import uvicorn
from dotenv import load_dotenv

load_dotenv()

if __name__ == "__main__":
    port = int(os.getenv("PORT", 5000))
    print(f"Starting NexHire AI Platform (Python/FastAPI) on port {port} 🚀")
    uvicorn.run("app.main:app", host="0.0.0.0", port=port, reload=True)
