/**
 * CloudFront Function: URL Rewrite for Directory Index
 * 
 * Purpose: Automatically append /index.html to directory requests
 * This fixes the issue where /news/ doesn't serve /news/index.html
 * 
 * CloudFront's DefaultRootObject only applies to the root path (/).
 * This function extends that behavior to all subdirectories.
 * 
 * Examples:
 * - /news/ -> /news/index.html
 * - /dashboard/ -> /dashboard/index.html
 * - / -> / (unchanged, DefaultRootObject handles this)
 * - /news/article.html -> /news/article.html (unchanged)
 * 
 * Deployment: Associate this function with CloudFront distribution as a Viewer Request function
 * 
 * @see https://docs.aws.amazon.com/AmazonCloudFront/latest/DeveloperGuide/cloudfront-functions.html
 */

function handler(event) {
    var request = event.request;
    var uri = request.uri;
    
    // Check if the URI ends with a slash (directory request)
    if (uri.endsWith('/')) {
        // Append index.html to directory requests
        request.uri = uri + 'index.html';
    }
    // Check if the URI has no file extension (might be a directory without trailing slash)
    else if (!uri.includes('.') && uri !== '/') {
        // Add trailing slash and index.html
        request.uri = uri + '/index.html';
    }
    
    return request;
}
