package main

import (
	"bytes"
	"compress/zlib"
	"encoding/base64"
	"flag"
	"fmt"
	"io"
	"net/url"
	"os"
	"strings"
)

const viewerBaseURL = "https://reviewdog.github.io/rdjson-viewer"

func main() {
	var inputFile string
	var format string
	var baseHTMLURL string

	flag.StringVar(&inputFile, "file", "", "Path to the input file (if not specified, reads from stdin)")
	flag.StringVar(&format, "format", "rdjson", "Format of the input (rdjson or rdjsonl)")
	flag.StringVar(&baseHTMLURL, "base-url", "", "Base HTML URL for file links")
	flag.Parse()

	if format != "rdjson" && format != "rdjsonl" {
		fmt.Fprintln(os.Stderr, "Error: format must be either 'rdjson' or 'rdjsonl'")
		os.Exit(1)
	}

	var input []byte
	var err error

	if inputFile != "" {
		input, err = os.ReadFile(inputFile)
	} else {
		input, err = io.ReadAll(os.Stdin)
	}

	if err != nil {
		fmt.Fprintf(os.Stderr, "Error reading input: %v\n", err)
		os.Exit(1)
	}

	compressedData, err := compressData(input)
	if err != nil {
		fmt.Fprintf(os.Stderr, "Error compressing data: %v\n", err)
		os.Exit(1)
	}

	viewerURL, err := buildViewerURL(compressedData, format, baseHTMLURL)
	if err != nil {
		fmt.Fprintf(os.Stderr, "Error building viewer URL: %v\n", err)
		os.Exit(1)
	}

	fmt.Println(viewerURL)
}

func compressData(data []byte) (string, error) {
	var buf bytes.Buffer
	zw, err := zlib.NewWriterLevel(&buf, zlib.DefaultCompression)
	if err != nil {
		return "", err
	}

	_, err = zw.Write(data)
	if err != nil {
		return "", err
	}

	if err := zw.Close(); err != nil {
		return "", err
	}

	compressed := buf.Bytes()
	encoded := base64.StdEncoding.EncodeToString(compressed)

	return encoded, nil
}

func buildViewerURL(compressedData, format, baseHTMLURL string) (string, error) {
	u, err := url.Parse(viewerBaseURL)
	if err != nil {
		return "", err
	}

	q := u.Query()
	q.Set(format, compressedData)

	if baseHTMLURL != "" {
		q.Set("base_path_url", baseHTMLURL)
	}

	u.RawQuery = q.Encode()

	// Replace any '+' with '%20' for better URL compatibility
	return strings.Replace(u.String(), "+", "%20", -1), nil
}
