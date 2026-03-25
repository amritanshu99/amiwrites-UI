<?xml version="1.0" encoding="UTF-8"?>
<xsl:stylesheet version="1.0"
  xmlns:xsl="http://www.w3.org/1999/XSL/Transform"
  xmlns:sitemap="http://www.sitemaps.org/schemas/sitemap/0.9">

  <xsl:output method="html" encoding="UTF-8" indent="yes" />

  <xsl:template match="/">
    <html>
      <head>
        <title>AmiVerse Sitemap</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 2rem; color: #111827; }
          h1 { margin-bottom: 0.5rem; }
          table { border-collapse: collapse; width: 100%; }
          th, td { border: 1px solid #d1d5db; padding: 0.5rem; text-align: left; }
          th { background: #f3f4f6; }
          a { color: #2563eb; }
        </style>
      </head>
      <body>
        <h1>AmiVerse XML Sitemap</h1>
        <p>Total URLs: <xsl:value-of select="count(sitemap:urlset/sitemap:url)" /></p>
        <table>
          <tr>
            <th>URL</th>
            <th>Last Modified</th>
            <th>Change Frequency</th>
            <th>Priority</th>
          </tr>
          <xsl:for-each select="sitemap:urlset/sitemap:url">
            <tr>
              <td>
                <a>
                  <xsl:attribute name="href"><xsl:value-of select="sitemap:loc" /></xsl:attribute>
                  <xsl:value-of select="sitemap:loc" />
                </a>
              </td>
              <td><xsl:value-of select="sitemap:lastmod" /></td>
              <td><xsl:value-of select="sitemap:changefreq" /></td>
              <td><xsl:value-of select="sitemap:priority" /></td>
            </tr>
          </xsl:for-each>
        </table>
      </body>
    </html>
  </xsl:template>
</xsl:stylesheet>
