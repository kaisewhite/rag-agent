# Regression Testing Document

## Recent Changes (2025-02-11)
1. Enhanced vector similarity search with score boosting
2. Added progress tracking with minimal logging
3. Improved section number matching
4. Modified crawler output format

## Recent Changes (2025-02-11 17:27)
1. Fixed crawler.run method implementation
2. Enhanced error handling and validation
3. Improved progress tracking
4. Better URL handling

## Recent Changes (2025-02-11 17:30)
1. Added PDF document handling
2. Implemented content type detection
3. Enhanced metadata extraction
4. Added format-specific processing

## Recent Changes (2025-02-11 17:56)
1. Enhanced PDF handling robustness
2. Added support for various PDF content types
3. Improved error handling for PDF processing
4. Added detailed PDF metadata extraction

## Recent Changes (2025-02-11 17:58)
1. Replaced pdf-parse with pdf2json for better reliability
2. Enhanced PDF text extraction
3. Improved PDF metadata handling
4. Added robust error handling for PDF processing

## Recent Changes (2025-02-12 05:42:50)
1. Removed description field from metadata
2. Standardized metadata field structure
3. Enhanced metadata filtering in query results
4. Improved response consistency

## Recent Changes (2025-02-12 05:53:15)
1. Added 404 response for no results found
2. Updated query error handling
3. Improved error message clarity
4. Enhanced state name handling

## Recent Changes (2025-02-12 05:55:03)
1. Enhanced no results response with suggestions
2. Added context-aware question rephrasing
3. Improved situational suggestions
4. Updated API documentation

## Recent Changes (2025-02-12 05:57:41)
1. Updated suggestions for AI chatbot context
2. Added topic-based suggestions
3. Removed document upload references
4. Enhanced user guidance

## Potential Regression Areas to Test

### 1. Query System
- [ ] Verify that score boosting doesn't overshadow semantic relevance
- [ ] Check that section number extraction works for various formats (§204, 204, Section 204)
- [ ] Ensure non-section-specific queries still work effectively
- [ ] Validate that increased candidate pool (20) improves result quality
- [ ] Test that score normalization (capping at 1.0) doesn't affect ranking

### 2. Crawler Performance
- [ ] Verify progress tracking doesn't impact crawling speed
- [ ] Check that reduced logging doesn't hide important errors
- [ ] Ensure robots.txt compliance is maintained
- [ ] Validate content storage with minimal logging
- [ ] Test concurrent crawling with progress updates

### 3. Storage System
- [ ] Confirm embeddings are generated correctly
- [ ] Verify metadata is preserved
- [ ] Check that state filtering still works
- [ ] Validate URL normalization
- [ ] Test storage with various content lengths

### 4. Progress Tracking
- [ ] Verify 30-second update interval is appropriate
- [ ] Check accuracy of processed/stored/skipped counts
- [ ] Ensure progress tracking works with large datasets
- [ ] Validate memory usage during long crawls
- [ ] Test progress reporting with concurrent operations

### 5. Crawler Functionality
- [ ] Verify crawler.run works with single URL
- [ ] Test crawler.run with multiple URLs
- [ ] Check error handling for invalid URLs
- [ ] Validate state parameter handling
- [ ] Test base path extraction and usage

### 6. Error Handling
- [ ] Test invalid URL handling
- [ ] Verify missing state parameter error
- [ ] Check robots.txt compliance
- [ ] Test network error handling
- [ ] Validate content processing errors

### 7. PDF Processing
- [ ] Verify PDF text extraction accuracy
- [ ] Test handling of large PDF files
- [ ] Check PDF metadata extraction
- [ ] Validate PDF content storage
- [ ] Test PDF processing performance

### 8. Content Type Handling
- [ ] Verify correct content type detection
- [ ] Test handling of unsupported formats
- [ ] Check format-specific processing
- [ ] Validate metadata for different formats
- [ ] Test concurrent processing of mixed formats

### 9. Storage Integration
- [ ] Test PDF content storage
- [ ] Verify metadata preservation
- [ ] Check content type tracking
- [ ] Validate PDF-specific fields
- [ ] Test mixed format storage

### 10. Enhanced PDF Processing
- [ ] Test PDFs with octet-stream content type
- [ ] Verify handling of encrypted PDFs
- [ ] Test PDFs with missing metadata
- [ ] Check handling of malformed PDFs
- [ ] Validate buffer processing

### 11. PDF Processing with pdf2json
- [ ] Test text extraction quality
- [ ] Verify metadata extraction
- [ ] Check page count accuracy
- [ ] Test handling of large PDFs
- [ ] Validate memory usage

### 12. Error Handling
- [ ] Test corrupt PDF handling
- [ ] Verify empty PDF detection
- [ ] Check error message clarity
- [ ] Test memory cleanup
- [ ] Validate error recovery

### 13. Metadata Field Structure
- [ ] Verify description field is removed from responses
- [ ] Check all required metadata fields are present
- [ ] Test metadata consistency across different content types
- [ ] Validate backward compatibility
- [ ] Check query response structure

### 14. Query Response Format
- [ ] Test source metadata structure
- [ ] Verify score calculation
- [ ] Check state filtering
- [ ] Validate URL handling
- [ ] Test title fallback

### 15. Query Error Handling
- [ ] Test 404 response for no results
- [ ] Verify error message format
- [ ] Check state name normalization
- [ ] Test error status codes
- [ ] Validate response structure

### 16. Suggestion Generation
- [ ] Test alternative question generation
- [ ] Verify situational suggestions
- [ ] Check context awareness
- [ ] Test different question types
- [ ] Validate suggestion relevance

## Testing Steps
1. Run crawler on test documentation
   ```bash
   # Test crawling with progress tracking
   curl -X POST "http://localhost:3000/api/crawl" \
        -H "Content-Type: application/json" \
        -d '{"url": "https://test.gov/docs", "state": "Test"}'
   ```

2. Verify query accuracy
   ```bash
   # Test section-specific query
   curl -X POST "http://localhost:3000/api/query/ask" \
        -H "Content-Type: application/json" \
        -d '{"question": "Explain § 204", "state": "New York"}'
   ```

3. Monitor progress updates
   - Check console output every 30 seconds
   - Verify metrics accuracy
   - Validate final statistics

4. Test basic crawling:
```bash
curl -X POST "http://localhost:5003/api/crawler/crawl" \
     -H "Content-Type: application/json" \
     -d '{
       "urls": ["https://test.gov/docs"],
       "state": "Test"
     }'
```

5. Test multiple URLs:
```bash
curl -X POST "http://localhost:5003/api/crawler/crawl" \
     -H "Content-Type: application/json" \
     -d '{
       "urls": [
         "https://test1.gov/docs",
         "https://test2.gov/docs"
       ],
       "state": "Test"
     }'
```

6. Test error cases:
```bash
# Missing state
curl -X POST "http://localhost:5003/api/crawler/crawl" \
     -H "Content-Type: application/json" \
     -d '{
       "urls": ["https://test.gov/docs"]
     }'

# Invalid URL
curl -X POST "http://localhost:5003/api/crawler/crawl" \
     -H "Content-Type: application/json" \
     -d '{
       "urls": ["not-a-url"],
       "state": "Test"
     }'
```

7. Test PDF crawling:
```bash
curl -X POST "http://localhost:5003/api/crawler/crawl" \
     -H "Content-Type: application/json" \
     -d '{
       "urls": ["https://example.gov/document.pdf"],
       "state": "Test"
     }'
```

8. Test mixed format crawling:
```bash
curl -X POST "http://localhost:5003/api/crawler/crawl" \
     -H "Content-Type: application/json" \
     -d '{
       "urls": [
         "https://example.gov/page.html",
         "https://example.gov/document.pdf"
       ],
       "state": "Test"
     }'
```

9. Verify PDF processing:
- Check extracted text quality
- Verify metadata extraction
- Validate storage format
- Monitor memory usage
- Check processing time

10. Test various PDF types:
```bash
# Standard PDF
curl -X POST "http://localhost:5003/api/crawler/crawl" \
     -H "Content-Type: application/json" \
     -d '{
       "urls": ["https://example.gov/standard.pdf"],
       "state": "Test"
     }'

# PDF with octet-stream content type
curl -X POST "http://localhost:5003/api/crawler/crawl" \
     -H "Content-Type: application/json" \
     -d '{
       "urls": ["https://example.gov/octet-stream.pdf"],
       "state": "Test"
     }'

# Large PDF
curl -X POST "http://localhost:5003/api/crawler/crawl" \
     -H "Content-Type: application/json" \
     -d '{
       "urls": ["https://example.gov/large.pdf"],
       "state": "Test"
     }'
```

11. Test PDF extraction:
```bash
# Test with various PDF types
curl -X POST "http://localhost:5003/api/crawler/crawl" \
     -H "Content-Type: application/json" \
     -d '{
       "urls": [
         "https://example.gov/simple.pdf",
         "https://example.gov/complex.pdf",
         "https://example.gov/large.pdf"
       ],
       "state": "Test"
     }'
```

12. Test metadata structure:
```bash
# Test query response format
curl -X POST "http://localhost:5004/api/query/ask" \
     -H "Content-Type: application/json" \
     -d '{
       "question": "What are the requirements for Section 204?",
       "state": "New York"
     }'

# Verify metadata fields
curl -X POST "http://localhost:5004/api/crawler/crawl" \
     -H "Content-Type: application/json" \
     -d '{
       "urls": [
         "https://example.gov/test.html",
         "https://example.gov/test.pdf"
       ],
       "state": "Test"
     }'
```

13. Test no results handling:
```bash
# Test query with no results
curl -X POST "http://localhost:5004/api/query/ask" \
     -H "Content-Type: application/json" \
     -d '{
       "question": "Does a cop have the right to ask for my Id if I haven't committed a crime?",
       "state": "Texas"
     }'

# Expected response (404):
# {
#   "error": "No relevant documentation found for \"Does a cop have the right to ask for my Id if I haven't committed a crime?\" in Texas",
#   "sources": []
# }
```

14. Test suggestion generation:
```bash
# Test query with no results to get suggestions
curl -X POST "http://localhost:5004/api/query/ask" \
     -H "Content-Type: application/json" \
     -d '{
       "question": "Does a cop have the right to ask for my ID if I haven't committed a crime?",
       "state": "Texas"
     }'

# Expected response (404):
# {
#   "answer": "We couldn't find any relevant information for your question: \"Does a cop have the right to ask for my ID if I haven't committed a crime?\" in Texas. This might be because the question needs to be rephrased to better match available information.",
#   "suggestions": [
#     "Try rephrasing your question, e.g., 'When can a police officer ask for identification in Texas?'",
#     "Specify if you're asking about a particular situation, like during a traffic stop, routine patrol, or at a public event.",
#     "Consider asking about specific police procedures or citizen rights during identification checks."
#   ],
#   "sources": []
# }
```

## Known Issues
1. Query inconsistency with same input (Fixed)
   - Solution: Added score boosting and increased candidate pool
   - Migration needed: None, changes are backward compatible

2. Excessive logging (Fixed)
   - Solution: Implemented progress tracking with 30-second intervals
   - Migration needed: None, logging changes are transparent

3. PDF processing memory usage (Monitor)
   - Solution: Implemented streaming PDF processing
   - Impact: May affect processing speed
   - Mitigation: Monitor and optimize as needed

4. Content type detection (Fixed)
   - Solution: Added explicit content type handling
   - Impact: None, transparent to existing functionality

5. PDF processing robustness (Fixed)
   - Solution: Added comprehensive error handling
   - Impact: More reliable PDF processing
   - Migration: No changes needed, backward compatible

6. Content type detection (Enhanced)
   - Solution: Added support for octet-stream PDFs
   - Impact: Better PDF detection
   - Migration: Automatic, no changes needed

7. PDF library initialization (Fixed)
   - Solution: Switched to pdf2json library
   - Impact: More reliable PDF processing
   - Migration: Automatic, no changes needed

8. PDF text extraction quality (Monitor)
   - Solution: Using pdf2json's native text extraction
   - Impact: May need tuning for complex layouts
   - Mitigation: Monitor and adjust as needed

9. Metadata field structure (Fixed)
   - Solution: Removed description field and standardized metadata
   - Impact: More consistent response format
   - Migration: Automatic, backward compatible

10. Query response format (Enhanced)
   - Solution: Added explicit metadata field filtering
   - Impact: Cleaner response structure
   - Migration: No changes needed

11. Query response for no results (Fixed)
    - Solution: Added 404 status code for no results
    - Impact: Better error handling
    - Migration: Automatic, backward compatible

12. No results response (Enhanced)
    - Solution: Added chatbot-appropriate suggestions and topic-based guidance
    - Impact: More natural AI interaction
    - Migration: Automatic, backward compatible

## Verification Checklist
- [ ] Query results are consistent for same input
- [ ] Progress updates are timely and accurate
- [ ] Crawler performance is maintained
- [ ] Error handling is effective
- [ ] Resource usage is optimized
- [ ] Crawler successfully processes single URL
- [ ] Multiple URLs are handled correctly
- [ ] Progress updates appear every 30 seconds
- [ ] Error messages are clear and helpful
- [ ] Base paths are correctly extracted
- [ ] Content is properly stored
- [ ] Memory usage remains stable
- [ ] Description field is not present in responses
- [ ] All required metadata fields are included
- [ ] Query responses maintain consistent structure
- [ ] Content type handling preserves metadata
- [ ] State filtering works with new structure
- [ ] 404 status returned for no results
- [ ] Error messages are clear and helpful
- [ ] State normalization works correctly
- [ ] Response structure is consistent
- [ ] Suggestions are relevant to the question
- [ ] Alternative questions are well-formed
- [ ] Situational suggestions are helpful
- [ ] Response format is consistent
- [ ] Suggestions are appropriate for AI chatbot
- [ ] Topic suggestions are relevant
- [ ] No references to document uploads
- [ ] Response maintains conversational tone

2025-02-11 17:22:20
2025-02-11 17:27:08
2025-02-12 05:42:50
2025-02-12 05:53:15
2025-02-12 05:55:03
2025-02-12 05:57:41