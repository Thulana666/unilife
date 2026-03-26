import { NextResponse } from 'next/server';

export async function GET(req) {
    try {
        const { searchParams } = new URL(req.url);
        const url = searchParams.get('url');

        if (!url) {
            return new NextResponse("URL parameter is required", { status: 400 });
        }

        const filename = searchParams.get('filename') || '';
        const download = searchParams.get('download') === 'true';

        // Fetch the raw stream directly from Cloudinary server-to-server 
        // This avoids strict browser CORS locks and hotlink 401 errors
        const response = await fetch(url);
        
        if (!response.ok) {
            return new NextResponse("Failed to fetch from Cloudinary", { status: response.status });
        }

        // Determine correct content type explicitly from the original filename payload
        let contentType = 'application/octet-stream';
        const lowerName = filename.toLowerCase();
        const lowerUrl = url.toLowerCase();
        
        if (lowerName.endsWith('.pdf') || lowerUrl.includes('.pdf')) contentType = 'application/pdf';
        else if (lowerName.endsWith('.png') || lowerUrl.includes('.png')) contentType = 'image/png';
        else if (lowerName.endsWith('.jpg') || lowerName.endsWith('.jpeg') || lowerUrl.includes('.jpg')) contentType = 'image/jpeg';
        else if (lowerName.endsWith('.docx') || lowerUrl.includes('.docx')) contentType = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
        
        // Either force inline structural UI viewing, or native attachment download streams
        const disposition = download ? `attachment; filename="${filename || 'document'}"` : 'inline';

        return new Response(response.body, {
            headers: {
                'Content-Type': contentType,
                'Content-Disposition': disposition,
                'Cache-Control': 'public, max-age=86400',
            },
        });

    } catch (error) {
        console.error("Cloudinary Proxy Error:", error);
        return new NextResponse("Internal Server Error", { status: 500 });
    }
}
