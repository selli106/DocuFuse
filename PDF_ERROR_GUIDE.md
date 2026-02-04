# PDF Upload Error Troubleshooting Guide

## What Was Improved

Your PDF/file processing service now has **much better error messages**. When a PDF upload fails, you'll see specific error details instead of "Unknown error".

## Common PDF Upload Errors & Solutions

### 1. **"Cannot determine file type"**
**Cause:** File doesn't have a recognized extension or MIME type  
**Solution:**
- Ensure the file has a `.pdf` extension
- Try renaming the file to include the extension if it's missing
- Verify the file is actually a PDF (not a different format renamed)

### 2. **"File is too large (XXX MB). Maximum size is 50MB"**
**Cause:** PDF file exceeds 50MB  
**Solution:**
- Compress the PDF using an online tool like:
  - https://smallpdf.com/compress-pdf
  - https://ilovepdf.com/compress-pdf
- Or split the large PDF into smaller files
- Try uploading each chunk separately

### 3. **"AI could not read pages from this PDF. It may be password-protected..."**
**Cause:** PDF is:
- Password/encryption protected
- Has scanned images without text (OCR needed)
- Contains unsupported formatting  
**Solution:**
- Remove password protection from the PDF
- Use OCR tools for scanned PDFs
- Try converting to a standard PDF format

### 4. **"Unsupported file format or content could not be parsed by AI"**
**Cause:** File format is not recognized or data is corrupted  
**Solution:**
- Verify the file isn't corrupted - try opening it normally
- Convert to standard PDF using tools like:
  - Microsoft Word → Save as PDF
  - Google Docs → Download as PDF
- Try a different PDF file to isolate the issue

### 5. **"Authentication failed. Please ensure Puter.js is properly configured"**
**Cause:** Puter.js authentication issue  
**Solution:**
- Refresh the page (Ctrl+R or Cmd+R)
- Check the browser console (F12 → Console) for Puter.js errors
- Visit the diagnostics page: `/diagnostics.html`
- Check your internet connection

### 6. **"API rate limit exceeded. Please wait a moment and try again"**
**Cause:** Too many requests sent in a short time  
**Solution:**
- Wait 1-2 minutes
- Try uploading fewer files at once
- Upload files one at a time instead of many together

### 7. **"Request timed out. The file may be too large..."**
**Cause:** File processing took too long  
**Solution:**
- Reduce file size
- Simplify complex PDFs
- Try again - network may have been slow

### 8. **"Network error occurred. Please check your internet connection"**
**Cause:** Network connectivity issue  
**Solution:**
- Check your internet connection
- Try a different file
- Refresh the page and try again
- Check if Puter.js service is accessible at https://js.puter.com/v2/

## Debugging Tips

### 1. **Check Browser Console**
Press F12 and look for messages starting with:
- `Processing [filename]...` - shows when file processing starts
- `Successfully processed [filename]...` - shows when complete
- `Error processing [filename]:` - shows detailed error info

### 2. **Use the Diagnostics Page**
Visit: `/diagnostics.html`

This will show:
- ✓ If Puter.js is loaded
- ✓ If AI features are available  
- ✓ Test results
- ℹ Configuration details

### 3. **Test with Simple Files First**
Try uploading in this order:
1. Small text file (`.txt`)
2. Small PDF (< 2MB)
3. Larger or more complex PDFs

### 4. **Monitor File Size**
The service logs file sizes. Check console for:
```
Processing filename.pdf (application/pdf) via Puter.js AI...
```

## File Support Matrix

| Format | Size Limit | Processing | Speed |
|--------|-----------|-----------|-------|
| Plain Text (TXT, MD, etc) | Any | Local | Fast |
| PDF | 50MB | Puter.js AI | Slow |
| Images (PNG, JPG, WebP) | 50MB | Puter.js AI | Slow |
| RTF | 50MB | Puter.js AI | Slow |

- **Local processing:** Happens on your device, very fast
- **Puter.js AI:** Requires API call, may take 10-30 seconds per file

## Example Error Messages & Fixes

### Scenario: "Unknown error"
1. Open Browser Console (F12)
2. Look for `Error processing [filename]:` entry
3. See the `originalError` for exact issue
4. Refer to sections above based on the specific error

### Scenario: Multiple files fail
1. Try uploading just one file
2. If it fails, check console for why
3. If it succeeds, the issue might be:
   - Too many concurrent uploads
   - API rate limiting
   - Browser memory limits

## Advanced Troubleshooting

### If all PDFs fail:
1. Check Puter.js availability: `/test-puter.html`
2. Verify browser has internet access
3. Check for browser extensions blocking API calls
4. Try in an incognito/private window
5. Try a different browser

### If specific PDFs fail:
1. Open the PDF in your browser to confirm it works
2. Check file size doesn't exceed 50MB
3. Try converting the PDF to a different format
4. Test with a reference PDF first

## Contact Support

If errors persist:
1. Visit `/diagnostics.html` and screenshot results
2. Check browser console for error messages
3. Note the file name and size that fails
4. Visit: https://github.com/selli106/DocuFuse/issues
5. Include:
   - Error message from the app
   - Browser console output
   - File details (name, size, format)
   - Screenshots of diagnostics page
