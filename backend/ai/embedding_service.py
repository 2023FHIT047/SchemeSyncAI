import logging

logger = logging.getLogger(__name__)

class EmbeddingService:
    """
    Extensible service interface for semantic vector embeddings using SentenceTransformers or pgvector/FAISS.
    """

    def __init__(self, model_name="all-MiniLM-L6-v2"):
        self.model_name = model_name
        self.model = None

    def load_model(self):
        """Lazy load sentence transformer model if installed."""
        if self.model is None:
            try:
                from sentence_transformers import SentenceTransformer
                self.model = SentenceTransformer(self.model_name)
            except ImportError:
                logger.info("SentenceTransformers package not installed. Using mock embedding interface.")

    def generate_embedding(self, text):
        """Generates embedding vector for a given text string."""
        self.load_model()
        if self.model:
            return self.model.encode(text).tolist()
        # Mock vector output for architectural compatibility
        return [0.0] * 384

    def compute_similarity(self, query_text, target_text):
        """Computes semantic similarity score between query text and target text."""
        self.load_model()
        if self.model:
            from sentence_transformers import util
            emb1 = self.model.encode(query_text)
            emb2 = self.model.encode(target_text)
            return float(util.cos_sim(emb1, emb2)[0][0])
        # Simple fallback text overlap score
        query_words = set(query_text.lower().split())
        target_words = set(target_text.lower().split())
        if not query_words:
            return 0.0
        return len(query_words.intersection(target_words)) / len(query_words)
