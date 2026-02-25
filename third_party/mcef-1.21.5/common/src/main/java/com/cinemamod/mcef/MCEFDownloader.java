/*
 *     MCEF (Minecraft Chromium Embedded Framework)
 *     Copyright (C) 2023 CinemaMod Group
 *
 *     This library is free software; you can redistribute it and/or
 *     modify it under the terms of the GNU Lesser General Public
 *     License as published by the Free Software Foundation; either
 *     version 2.1 of the License, or (at your option) any later version.
 *
 *     This library is distributed in the hope that it will be useful,
 *     but WITHOUT ANY WARRANTY; without even the implied warranty of
 *     MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the GNU
 *     Lesser General Public License for more details.
 *
 *     You should have received a copy of the GNU Lesser General Public
 *     License along with this library; if not, write to the Free Software
 *     Foundation, Inc., 51 Franklin Street, Fifth Floor, Boston, MA  02110-1301
 *     USA
 */

package com.cinemamod.mcef;

import com.cinemamod.mcef.internal.MCEFDownloadListener;
import org.apache.commons.compress.archivers.tar.TarArchiveEntry;
import org.apache.commons.compress.archivers.tar.TarArchiveInputStream;
import org.apache.commons.compress.compressors.gzip.GzipCompressorInputStream;
import org.apache.commons.io.FileUtils;

import java.io.*;
import java.net.HttpURLConnection;
import java.net.URL;

/**
 * A downloader and extraction tool for java-cef builds.
 * <p>
 * Downloads for <a href="https://github.com/CinemaMod/java-cef">CinemaMod java-cef</a> are provided by the CinemaMod Group unless changed
 * in the MCEFSettings properties file; see {@link MCEFSettings}.
 * Email ds58@mailbox.org for any questions or concerns regarding the file hosting.
 */
public class MCEFDownloader {
    private static final String JAVA_CEF_DOWNLOAD_URL = "${host}/java-cef-builds/${java-cef-commit}/${platform}.tar.gz";
    private static final String JAVA_CEF_CHECKSUM_DOWNLOAD_URL = "${host}/java-cef-builds/${java-cef-commit}/${platform}.tar.gz.sha256";
    private static final int CONNECT_TIMEOUT_MS = 30_000;
    private static final int READ_TIMEOUT_MS = 180_000;
    private static final int MAX_DOWNLOAD_ATTEMPTS = 5;
    private static final int DOWNLOAD_BUFFER_SIZE = 8192;
    private static final long RETRY_DELAY_MS = 2000L;

    private final String host;
    private final String javaCefCommitHash;
    private final MCEFPlatform platform;

    public MCEFDownloader(String host, String javaCefCommitHash, MCEFPlatform platform) {
        this.host = host;
        this.javaCefCommitHash = javaCefCommitHash;
        this.platform = platform;
    }

    public String getHost() {
        return host;
    }

    public String getJavaCefDownloadUrl() {
        return formatURL(JAVA_CEF_DOWNLOAD_URL);
    }

    public String getJavaCefChecksumDownloadUrl() {
        return formatURL(JAVA_CEF_CHECKSUM_DOWNLOAD_URL);
    }

    private String formatURL(String url) {
        return url
                .replace("${host}", host)
                .replace("${java-cef-commit}", javaCefCommitHash)
                .replace("${platform}", platform.getNormalizedName());
    }

    public void downloadJavaCefBuild() throws IOException {
        File mcefLibrariesPath = new File(System.getProperty("mcef.libraries.path"));
        MCEFDownloadListener.INSTANCE.setTask("Downloading Chromium Embedded Framework");
        downloadFile(getJavaCefDownloadUrl(), new File(mcefLibrariesPath, platform.getNormalizedName() + ".tar.gz"));
    }

    /**
     * @return true if the jcef build checksum file matches the remote checksum file (for the {@link MCEFDownloader#javaCefCommitHash}),
     * false if the jcef build checksum file did not exist or did not match; this means we should redownload JCEF
     * @throws IOException
     */
    public boolean downloadJavaCefChecksum() throws IOException {
        File mcefLibrariesPath = new File(System.getProperty("mcef.libraries.path"));
        File jcefBuildHashFileTemp = new File(mcefLibrariesPath, platform.getNormalizedName() + ".tar.gz.sha256.temp");
        File jcefBuildHashFile = new File(mcefLibrariesPath, platform.getNormalizedName() + ".tar.gz.sha256");

        MCEFDownloadListener.INSTANCE.setTask("Downloading Checksum");
        downloadFile(getJavaCefChecksumDownloadUrl(), jcefBuildHashFileTemp);

        if (jcefBuildHashFile.exists()) {
            boolean sameContent = FileUtils.contentEquals(jcefBuildHashFile, jcefBuildHashFileTemp);
            if (sameContent) {
                jcefBuildHashFileTemp.delete();
                return true;
            } else {
                MCEF.getLogger().warn("JCEF Hash does not match.");
            }
        } else {
            MCEF.getLogger().warn("Failed to download JCEF hash.");
        }

        jcefBuildHashFileTemp.renameTo(jcefBuildHashFile);

        return false;
    }

    public void extractJavaCefBuild(boolean delete) {
        File mcefLibrariesPath = new File(System.getProperty("mcef.libraries.path"));
        File tarGzArchive = new File(mcefLibrariesPath, platform.getNormalizedName() + ".tar.gz");
        extractTarGz(tarGzArchive, mcefLibrariesPath);
        if (delete) {
            if (tarGzArchive.exists()) {
                tarGzArchive.delete();
            }
        }
    }

    private static void downloadFile(String urlString, File outputFile) throws IOException {
        if (outputFile.getParentFile() != null) {
            outputFile.getParentFile().mkdirs();
        }

        IOException lastError = null;

        for (int attempt = 1; attempt <= MAX_DOWNLOAD_ATTEMPTS; attempt++) {
            HttpURLConnection connection = null;
            long existingBytes = outputFile.exists() ? outputFile.length() : 0L;
            boolean append = false;

            try {
                MCEF.getLogger().info(
                        "{} -> {} (attempt {}/{}, existing {} bytes)",
                        urlString,
                        outputFile.getCanonicalPath(),
                        attempt,
                        MAX_DOWNLOAD_ATTEMPTS,
                        existingBytes
                );

                URL url = new URL(urlString);
                connection = (HttpURLConnection) url.openConnection();
                connection.setConnectTimeout(CONNECT_TIMEOUT_MS);
                connection.setReadTimeout(READ_TIMEOUT_MS);
                connection.setInstanceFollowRedirects(true);
                connection.setRequestProperty("Accept-Encoding", "identity");

                String userAgent = MCEF.getSettings().getUserAgent();
                if (userAgent != null && !userAgent.isBlank()) {
                    connection.setRequestProperty("User-Agent", userAgent);
                } else {
                    connection.setRequestProperty("User-Agent", "MCEF-Downloader");
                }

                if (existingBytes > 0L) {
                    connection.setRequestProperty("Range", "bytes=" + existingBytes + "-");
                }

                int responseCode = connection.getResponseCode();
                if (responseCode == HttpURLConnection.HTTP_PARTIAL && existingBytes > 0L) {
                    append = true;
                } else if (responseCode == HttpURLConnection.HTTP_OK) {
                    if (existingBytes > 0L && !outputFile.delete()) {
                        MCEF.getLogger().warn("Could not delete stale partial file {}, overwriting.", outputFile.getName());
                    }
                    existingBytes = 0L;
                } else if (responseCode == 416 && existingBytes > 0L) {
                    if (!outputFile.delete()) {
                        throw new IOException("HTTP 416 and failed to delete stale partial file " + outputFile.getAbsolutePath());
                    }
                    MCEF.getLogger().warn("HTTP 416 for {}, retrying from scratch.", outputFile.getName());
                    continue;
                } else {
                    throw new IOException("HTTP " + responseCode);
                }

                long remoteSize = connection.getContentLengthLong();
                long totalSize = remoteSize > 0L ? remoteSize + (append ? existingBytes : 0L) : -1L;

                try (
                        BufferedInputStream inputStream = new BufferedInputStream(connection.getInputStream());
                        FileOutputStream outputStream = new FileOutputStream(outputFile, append)
                ) {
                    byte[] buffer = new byte[DOWNLOAD_BUFFER_SIZE];
                    int count;
                    long readBytes = existingBytes;

                    while ((count = inputStream.read(buffer)) != -1) {
                        outputStream.write(buffer, 0, count);
                        readBytes += count;

                        if (totalSize > 0L) {
                            float percentComplete = (float) readBytes / (float) totalSize;
                            MCEFDownloadListener.INSTANCE.setProgress(Math.min(percentComplete, 1.0f));
                        }
                    }
                }

                if (outputFile.length() <= 0L) {
                    throw new IOException("Downloaded file is empty");
                }

                MCEFDownloadListener.INSTANCE.setProgress(1.0f);
                return;
            } catch (IOException e) {
                lastError = e;
                MCEF.getLogger().warn(
                        "Download attempt {}/{} failed for {}: {}",
                        attempt,
                        MAX_DOWNLOAD_ATTEMPTS,
                        urlString,
                        e.getMessage()
                );

                if (attempt >= MAX_DOWNLOAD_ATTEMPTS) {
                    break;
                }

                try {
                    Thread.sleep(RETRY_DELAY_MS * attempt);
                } catch (InterruptedException interruptedException) {
                    Thread.currentThread().interrupt();
                    throw new IOException("Download interrupted for " + urlString, interruptedException);
                }
            } finally {
                if (connection != null) {
                    connection.disconnect();
                }
            }
        }

        throw new IOException("Failed to download " + urlString + " after " + MAX_DOWNLOAD_ATTEMPTS + " attempts", lastError);
    }

    private static void extractTarGz(File tarGzFile, File outputDirectory) {
        MCEFDownloadListener.INSTANCE.setTask("Extracting");

        outputDirectory.mkdirs();

        long fileSize = tarGzFile.length();
        long totalBytesRead = 0;

        try (TarArchiveInputStream tarInput = new TarArchiveInputStream(new GzipCompressorInputStream(new FileInputStream(tarGzFile)))) {
            TarArchiveEntry entry;
            while ((entry = tarInput.getNextTarEntry()) != null) {
                if (entry.isDirectory()) {
                    continue;
                }

                File outputFile = new File(outputDirectory, entry.getName());
                outputFile.getParentFile().mkdirs();

                try (OutputStream outputStream = new FileOutputStream(outputFile)) {
                    byte[] buffer = new byte[4096];
                    int bytesRead;
                    while ((bytesRead = tarInput.read(buffer)) != -1) {
                        outputStream.write(buffer, 0, bytesRead);
                        totalBytesRead += bytesRead;
                        float percentComplete = (((float) totalBytesRead / fileSize) / 2.6158204f); // Roughly the compression ratio
                        MCEFDownloadListener.INSTANCE.setProgress(percentComplete);
                        buffer = new byte[Math.max(4096, tarInput.available())];
                    }
                }
            }
        } catch (IOException e) {
            MCEF.getLogger().error("Failed to extract gzip file to " + outputDirectory, e);
        }

        MCEFDownloadListener.INSTANCE.setProgress(1.0f);
    }
}
