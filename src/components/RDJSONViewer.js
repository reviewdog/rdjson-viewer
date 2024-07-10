import React, { useState, useEffect } from 'react';

const LocationRange = ({ range }) => {
  if (!range) return null;

  const startLine = range.start?.line;
  const startColumn = range.start?.column;
  const endLine = range.end?.line;
  const endColumn = range.end?.column;

  let rangeString = '';

  if (startLine !== undefined) {
    rangeString += startLine;
    if (startColumn !== undefined) {
      rangeString += `:${startColumn}`;
    }
  }

  if (endLine !== undefined && (endLine !== startLine || startLine === undefined)) {
    rangeString += rangeString ? ' - ' : '';
    rangeString += endLine;
    if (endColumn !== undefined) {
      rangeString += `:${endColumn}`;
    }
  } else if (endColumn !== undefined && endColumn !== startColumn) {
    rangeString += `-${endColumn}`;
  }

  if (!rangeString) return null;

  return (
    <span className="font-mono bg-gray-100 px-1 py-0.5 rounded">
      {rangeString}
    </span>
  );
};

const RelatedLocation = ({ location, basePath }) => (
  <div className="mt-2 pl-4 border-l-2 border-gray-300">
    <p className="text-sm text-gray-600">{location.message}</p>
    <p className="text-sm">
      {getFileLink(location.location, basePath) ? (
        <a href={getFileLink(location.location, basePath)} target="_blank" rel="noopener noreferrer" className="font-semibold hover:underline">
          {location.location.path}
        </a>
      ) : (
        <span className="font-semibold">{location.location.path}</span>
      )}
      {location.location.range && (
        <span className="ml-2">
          <LocationRange range={location.location.range} />
        </span>
      )}
    </p>
  </div>
);

const getFileLink = (loc, basePath) => {
	if (!basePath || !loc.path) return null;
	let link = `${basePath}/${loc.path}`;
	if (loc.range) {
		if (loc.range.start.line) {
			link += `#L${loc.range.start.line}`;
			if (loc.range.end && loc.range.end.line && loc.range.end.line !== loc.range.start.line) {
				link += `-L${loc.range.end.line}`;
			}
		}
	}
	return link;
};


const DiagnosticCard = ({ diagnostic, basePath }) => {
  const { message, location, severity, source, code, suggestions, related_locations } = diagnostic;

  const severityColors = {
    ERROR: 'bg-red-100 border-red-500 text-red-700',
    WARNING: 'bg-yellow-100 border-yellow-500 text-yellow-700',
    INFO: 'bg-blue-100 border-blue-500 text-blue-700',
  };

  const cardColor = severity ? severityColors[severity] : 'bg-white border-gray-300';

  return (
    <div className={`border-l-4 rounded-lg shadow-md mb-6 overflow-hidden ${cardColor}`}>
      <div className="p-4">
        {severity && <h3 className="font-bold text-lg mb-2">{severity}</h3>}
        <p className="text-gray-800 mb-2">{message}</p>
        {location && (
          <p className="text-sm mb-2">
            {getFileLink(location, basePath) ? (
              <a href={getFileLink(location, basePath)} target="_blank" rel="noopener noreferrer" className="font-semibold hover:underline">
                {location.path}
              </a>
            ) : (
              <span className="font-semibold">{location.path}</span>
            )}
            {location.range && (
              <span className="ml-2">
                <LocationRange range={location.range} />
              </span>
            )}
          </p>
        )}
        <div className="flex flex-wrap gap-2 mb-2">
          {source && (
            <span className="bg-gray-200 text-gray-700 px-2 py-1 rounded text-sm">
              {source.name}
            </span>
          )}
          {code && (
            <span className="bg-gray-200 text-gray-700 px-2 py-1 rounded text-sm">
              {code.url ? (
                <a href={code.url} target="_blank" rel="noopener noreferrer" className="hover:underline">
                  {code.value}
                </a>
              ) : code.value}
            </span>
          )}
        </div>
        {suggestions && suggestions.length > 0 && (
          <div className="mt-2">
            <p className="font-semibold text-sm">Suggestions:</p>
            <ul className="list-disc pl-5">
              {suggestions.map((suggestion, index) => (
                <li key={index} className="text-sm mt-1">
                  Replace <LocationRange range={suggestion.range} /> with{' '}
                  <span className="font-mono bg-green-100 px-1 py-0.5 rounded">{suggestion.text}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
        {related_locations && related_locations.length > 0 && (
          <div className="mt-4">
            <p className="font-semibold text-sm mb-2">Related Locations:</p>
            {related_locations.map((relatedLocation, index) => (
              <RelatedLocation key={index} location={relatedLocation} basePath={basePath} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

const FilterControls = ({ filters, setFilters, diagnostics }) => {
  const uniqueSeverities = [...new Set(diagnostics.map(d => d.severity).filter(Boolean))];
  const uniqueSources = [...new Set(diagnostics.map(d => d.source?.name).filter(Boolean))];
  const uniqueRules = [...new Set(diagnostics.map(d => d.code?.value).filter(Boolean))];

  return (
    <div className="mb-4 flex flex-wrap gap-2">
      <select
        value={filters.severity}
        onChange={(e) => setFilters({ ...filters, severity: e.target.value })}
        className="p-2 border rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
      >
        <option value="">All Severities</option>
        {uniqueSeverities.map((severity) => (
          <option key={severity} value={severity}>{severity}</option>
        ))}
      </select>
      <select
        value={filters.source}
        onChange={(e) => setFilters({ ...filters, source: e.target.value })}
        className="p-2 border rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
      >
        <option value="">All Tools</option>
        {uniqueSources.map((source) => (
          <option key={source} value={source}>{source}</option>
        ))}
      </select>
      <select
        value={filters.rule}
        onChange={(e) => setFilters({ ...filters, rule: e.target.value })}
        className="p-2 border rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
      >
        <option value="">All Rules</option>
        {uniqueRules.map((rule) => (
          <option key={rule} value={rule}>{rule}</option>
        ))}
      </select>
    </div>
  );
};

const DiagnosticStats = ({ diagnostics }) => {
  const stats = diagnostics.reduce((acc, diagnostic) => {
    acc.total++;
    acc[diagnostic.severity] = (acc[diagnostic.severity] || 0) + 1;
    return acc;
  }, { total: 0 });

  const severityOrder = ['ERROR', 'WARNING', 'INFO'];

  return (
    <div className="bg-white rounded-lg shadow-md p-4 mb-4">
      <h3 className="text-lg font-bold mb-2">Diagnostic Statistics</h3>
      <div className="flex flex-wrap gap-4">
        <div className="flex items-center">
          <span className="font-semibold mr-2">Total:</span>
          <span className="bg-gray-200 px-2 py-1 rounded">{stats.total}</span>
        </div>
        {severityOrder.map(severity => (
          stats[severity] ? (
            <div key={severity} className="flex items-center">
              <span className="font-semibold mr-2">{severity}:</span>
              <span className={`px-2 py-1 rounded ${
                severity === 'ERROR' ? 'bg-red-200' :
                severity === 'WARNING' ? 'bg-yellow-200' : 'bg-blue-200'
              }`}>
                {stats[severity]}
              </span>
            </div>
          ) : null
        ))}
      </div>
    </div>
  );
};

const RDJSONViewer = () => {
  const [inputData, setInputData] = useState('');
  const [inputFormat, setInputFormat] = useState('rdjson');
  const [basePath, setBasePath] = useState('');
  const [diagnosticResult, setDiagnosticResult] = useState(null);
  const [error, setError] = useState('');
  const [filters, setFilters] = useState({
    severity: '',
    source: '',
    rule: '',
  });

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const rdjsonParam = urlParams.get('rdjson');
    const rdjsonlParam = urlParams.get('rdjsonl');
    const basePathParam = urlParams.get('base_path_url');

    if (basePathParam) {
      setBasePath(decodeURIComponent(basePathParam));
    }

    if (rdjsonParam) {
      try {
        const decodedData = decodeURIComponent(rdjsonParam);
        setInputData(decodedData);
        setInputFormat('rdjson');
        parseAndSetDiagnosticResult(decodedData, 'rdjson');
      } catch (err) {
        setError('Invalid rdjson URL parameter');
      }
    } else if (rdjsonlParam) {
      try {
        const decodedData = decodeURIComponent(rdjsonlParam);
        setInputData(decodedData);
        setInputFormat('rdjsonl');
        parseAndSetDiagnosticResult(decodedData, 'rdjsonl');
      } catch (err) {
        setError('Invalid rdjsonl URL parameter');
      }
    }
  }, []);

	const parseAndSetDiagnosticResult = (data, format) => {
    try {
      let parsedData;
      const trimmedData = data.trim();

      if (format === 'rdjsonl') {
        const diagnostics = trimmedData
          .split('\n')
          .filter(line => line.trim() !== '')
          .map(line => {
            try {
              return JSON.parse(line);
            } catch (err) {
              throw new Error(`Invalid JSON in line: ${line}`);
            }
          });
        parsedData = { diagnostics };
      } else { // rdjson
				parsedData = JSON.parse(trimmedData);
      }

      // Ensure the parsed data has a 'diagnostics' array
      if (!Array.isArray(parsedData.diagnostics)) {
        throw new Error('Invalid format: missing diagnostics array');
      }

      // Validate each diagnostic object
      parsedData.diagnostics.forEach((diagnostic, index) => {
        if (typeof diagnostic !== 'object' || diagnostic === null) {
          throw new Error(`Invalid diagnostic object at index ${index}`);
        }
      });

      setDiagnosticResult(parsedData);
      setError('');
    } catch (err) {
      setError(`Invalid format: ${err.message}`);
      setDiagnosticResult(null);
    }
  };

  const handleInputChange = (e) => {
    setInputData(e.target.value);
  };

  const handleFormatChange = (e) => {
    setInputFormat(e.target.value);
  };

  const handleSubmit = () => {
    parseAndSetDiagnosticResult(inputData, inputFormat);
    updateURL(inputData, inputFormat, basePath);
  };

  const filteredDiagnostics = diagnosticResult?.diagnostics.filter((diagnostic) => {
    return (
      (filters.severity === '' || diagnostic.severity === filters.severity) &&
      (filters.source === '' || diagnostic.source?.name === filters.source) &&
      (filters.rule === '' || diagnostic.code?.value === filters.rule)
    );
  });

  const handleBasePathChange = (e) => {
    setBasePath(e.target.value);
  };

  const updateURL = (data, format, basePath) => {
    const urlParams = new URLSearchParams();
    urlParams.set(format, encodeURIComponent(data));
    if (basePath) {
      urlParams.set('base_path_url', encodeURIComponent(basePath));
    }
    window.history.pushState({}, '', `${window.location.pathname}?${urlParams.toString()}`);
  };

  return (
    <div className="container mx-auto p-4 bg-gray-100 min-h-screen">
      <h1 className="text-3xl font-bold mb-6 text-center text-gray-800">RDJSON Viewer</h1>
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700">Input Format</label>
          <select
            value={inputFormat}
            onChange={handleFormatChange}
            className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
          >
            <option value="rdjson">rdjson</option>
            <option value="rdjsonl">rdjsonl</option>
          </select>
        </div>
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700">Base HTML Path (optional)</label>
          <input
            type="text"
            value={basePath}
            onChange={handleBasePathChange}
            placeholder="Enter base HTML path"
            className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
          />
        </div>
        <textarea
          value={inputData}
          onChange={handleInputChange}
          placeholder={`Paste your ${inputFormat} here...`}
          className="w-full h-40 p-2 border rounded mb-4 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        />
        <button
          onClick={handleSubmit}
          className="bg-blue-500 text-white px-6 py-2 rounded hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50"
        >
          Render
        </button>
      </div>
      {error && (
        <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-6" role="alert">
          <p className="font-bold">Error</p>
          <p>{error}</p>
        </div>
      )}
      {diagnosticResult && (
        <div>
          <h2 className="text-2xl font-bold mb-4 text-gray-800">Diagnostic Results</h2>
          <DiagnosticStats diagnostics={diagnosticResult.diagnostics} />
          <FilterControls
            filters={filters}
            setFilters={setFilters}
            diagnostics={diagnosticResult.diagnostics}
          />
          {filteredDiagnostics && filteredDiagnostics.map((diagnostic, index) => (
            <DiagnosticCard key={index} diagnostic={diagnostic} basePath={basePath} />
          ))}
        </div>
      )}
    </div>
  );
};

export default RDJSONViewer;
