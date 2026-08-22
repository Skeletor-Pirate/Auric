import fs from 'fs';
import path from 'path';
import { pipeline } from '@xenova/transformers';

const DATASET_PATH = path.join(process.cwd(), 'data', 'dataset.json');
const EMBEDDINGS_PATH = path.join(process.cwd(), 'data', 'embeddings.json');

// Advanced Chunking: Semantic (sentence-based) splitting with overlap
function splitIntoOverlappingChunks(text: string, sentencesPerChunk: number = 3, overlap: number = 1): string[] {
    // Basic sentence splitting (handles . ? !)
    const sentences = text.match(/[^.!?]+[.!?]+/g) || [text];
    
    if (sentences.length <= sentencesPerChunk) {
        return [text.trim()];
    }

    const chunks: string[] = [];
    for (let i = 0; i < sentences.length; i += (sentencesPerChunk - overlap)) {
        const chunk = sentences.slice(i, i + sentencesPerChunk).join(' ').trim();
        if (chunk.length > 10) { // filter out empty/garbage chunks
            chunks.push(chunk);
        }
    }
    return chunks;
}

async function ingest() {
    console.log("Loading dataset from", DATASET_PATH);
    const data = JSON.parse(fs.readFileSync(DATASET_PATH, 'utf-8'));
    
    console.log("Loading embedding model (all-MiniLM-L6-v2)...");
    const extractor = await pipeline('feature-extraction', 'Xenova/all-MiniLM-L6-v2');
    
    const vectorDB: any[] = [];
    
    console.log(`Processing ${data.length} rows...`);
    for (const row of data) {
        const queryId = row.query_id;
        const parentQuery = row.query;
        
        for (const passage of row.passages) {
            // Apply advanced chunking strategy
            const chunks = splitIntoOverlappingChunks(passage, 3, 1);
            
            for (let i = 0; i < chunks.length; i++) {
                const chunkText = chunks[i];
                
                // Extract embedding
                const output = await extractor(chunkText, { pooling: 'mean', normalize: true });
                const embedding = Array.from(output.data);
                
                vectorDB.push({
                    text: chunkText,
                    metadata: {
                        query_id: queryId,
                        parent_query: parentQuery,
                        chunk_index: i,
                        strategy: "semantic-overlap-3s-1s"
                    },
                    embedding: embedding
                });
            }
        }
    }
    
    console.log(`Successfully embedded ${vectorDB.length} chunks.`);
    fs.writeFileSync(EMBEDDINGS_PATH, JSON.stringify(vectorDB));
    console.log("Saved vector DB to", EMBEDDINGS_PATH);
}

ingest().catch(console.error);
