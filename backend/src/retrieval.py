"""
src/retrieval.py — hybrid RAG pipeline with cross-encoder reranking
Flow: query → BM25 top-10 + semantic top-10 → merge → rerank → top-3
"""
import os, sys
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from langchain_community.vectorstores import Chroma
from langchain_community.embeddings import HuggingFaceEmbeddings
from langchain_community.retrievers import BM25Retriever
from langchain.schema import Document
from sentence_transformers import CrossEncoder
from config import CHROMA_PERSIST_DIR, EMBEDDING_MODEL, RETRIEVER_TOP_K

CROSS_ENCODER_MODEL = "cross-encoder/ms-marco-MiniLM-L-6-v2"
_cross_encoder = None

def get_cross_encoder():
    global _cross_encoder
    if _cross_encoder is None:
        _cross_encoder = CrossEncoder(CROSS_ENCODER_MODEL)
    return _cross_encoder

def get_vectorstore():
    embeddings = HuggingFaceEmbeddings(
        model_name=EMBEDDING_MODEL,
        encode_kwargs={"normalize_embeddings": True},
    )
    return Chroma(persist_directory=CHROMA_PERSIST_DIR, embedding_function=embeddings)

def hybrid_retrieve_and_rerank(query, category_filter=None, top_k=None):
    if top_k is None:
        top_k = RETRIEVER_TOP_K
    vectorstore = get_vectorstore()
    semantic_kwargs = {"k": 10}
    if category_filter:
        semantic_kwargs["filter"] = {"category": category_filter}
    semantic_docs = vectorstore.as_retriever(search_kwargs=semantic_kwargs).get_relevant_documents(query)
    try:
        chroma_data = vectorstore.get(where={"category": category_filter} if category_filter else None)
        if chroma_data and chroma_data.get("documents"):
            bm25_docs = BM25Retriever.from_texts(
                texts=chroma_data["documents"], metadatas=chroma_data["metadatas"], k=10
            ).get_relevant_documents(query)
        else:
            bm25_docs = []
    except Exception as e:
        print(f"  [retrieval] BM25 fallback: {e}")
        bm25_docs = []
    seen, merged = set(), []
    for doc in semantic_docs + bm25_docs:
        key = doc.page_content[:120]
        if key not in seen:
            seen.add(key); merged.append(doc)
    if not merged:
        return []
    ce = get_cross_encoder()
    scores = ce.predict([(query, doc.page_content) for doc in merged])
    for doc, score in zip(merged, scores):
        doc.metadata["_rerank_score"] = float(score)
    ranked = sorted(zip(scores, merged), key=lambda x: x[0], reverse=True)
    return [doc for _, doc in ranked[:top_k]]

def format_context(docs):
    parts, seen, sources = [], set(), []
    for doc in docs:
        src = doc.metadata.get("source", "unknown")
        parts.append(f"[{src}]\n{doc.page_content}")
        if src not in seen:
            seen.add(src); sources.append(src)
    return "\n\n".join(parts), sources


def get_top_rerank_score(docs: list) -> float:
    """Returns the cross-encoder rerank score of the top document, or 1.0 if empty."""
    if not docs:
        return 1.0
    return docs[0].metadata.get("_rerank_score", 1.0)
