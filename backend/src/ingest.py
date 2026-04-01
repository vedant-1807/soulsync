"""
src/ingest.py — metadata-tagged ingestion pipeline
Run once (or re-run when docs change) to build ChromaDB vector index.
Usage: python src/ingest.py
"""
import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from pathlib import Path
from tqdm import tqdm

from langchain_community.document_loaders import PyPDFLoader
from langchain.text_splitter import RecursiveCharacterTextSplitter
from langchain_community.embeddings import HuggingFaceEmbeddings
from langchain_community.vectorstores import Chroma

from config import DOCS_DIR, CHROMA_PERSIST_DIR, EMBEDDING_MODEL

# ── Category folders ──────────────────────────────────────────────
CATEGORIES = ["cbt", "crisis", "general"]


def load_with_metadata(docs_dir: str) -> list:
    """
    Loads all PDFs from docs/cbt/, docs/crisis/, docs/general/.
    Tags each page with category, source filename, and doc_type metadata.
    This metadata is used at inference time for per-agent filtered retrieval.
    """
    all_docs = []
    docs_path = Path(docs_dir)

    for category in CATEGORIES:
        folder = docs_path / category
        if not folder.exists():
            print(f"  [WARN] Folder not found, skipping: {folder}")
            continue

        pdf_files = list(folder.glob("*.pdf"))
        if not pdf_files:
            print(f"  [WARN] No PDFs found in {folder}")
            continue

        print(f"  Loading {len(pdf_files)} PDF(s) from {category}/")
        for pdf_path in tqdm(pdf_files, desc=f"  {category}", leave=False):
            try:
                loader = PyPDFLoader(str(pdf_path))
                pages  = loader.load()
                for page in pages:
                    # Inject metadata — critical for per-agent filtered retrieval
                    page.metadata["category"] = category
                    page.metadata["source"]   = pdf_path.name
                    page.metadata["doc_type"] = "reference"
                all_docs.extend(pages)
            except Exception as e:
                print(f"  [ERROR] Failed to load {pdf_path.name}: {e}")

    return all_docs


def build_vector_store():
    print("\n=== SoulSync Ingestion Pipeline ===\n")

    # Step 1: Load PDFs with metadata
    print("[1/4] Loading PDFs...")
    documents = load_with_metadata(DOCS_DIR)
    if not documents:
        print("\n[ERROR] No documents loaded. Add PDFs to docs/cbt/, docs/crisis/, docs/general/")
        return
    print(f"  Loaded {len(documents)} pages total\n")

    # Step 2: Split into chunks
    print("[2/4] Splitting into chunks...")
    splitter = RecursiveCharacterTextSplitter(
        chunk_size=1000,
        chunk_overlap=150,
        separators=["\n\n", "\n", ". ", " ", ""],
    )
    chunks = splitter.split_documents(documents)
    print(f"  Created {len(chunks)} chunks\n")

    # Step 3: Generate embeddings
    print("[3/4] Generating embeddings (may take a few minutes on first run)...")
    embeddings = HuggingFaceEmbeddings(
        model_name=EMBEDDING_MODEL,
        model_kwargs={"device": "cpu"},
        encode_kwargs={"normalize_embeddings": True},
    )

    # Step 4: Persist to ChromaDB
    print(f"\n[4/4] Persisting to ChromaDB at {CHROMA_PERSIST_DIR}...")
    vectorstore = Chroma.from_documents(
        documents=chunks,
        embedding=embeddings,
        persist_directory=CHROMA_PERSIST_DIR,
    )
    vectorstore.persist()

    # Summary
    print(f"\n=== Ingestion complete ===")
    print(f"  Total chunks indexed : {len(chunks)}")
    print(f"  Vector store path    : {CHROMA_PERSIST_DIR}")
    categories = {}
    for chunk in chunks:
        cat = chunk.metadata.get("category", "unknown")
        categories[cat] = categories.get(cat, 0) + 1
    for cat, count in categories.items():
        print(f"  {cat:10s}           : {count} chunks")
    print()


if __name__ == "__main__":
    build_vector_store()
