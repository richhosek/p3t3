import React from 'react';
import { useQuery } from '@apollo/client';
import { QUERY_ALL_DECKS } from '../../utils/queries';

const DebugComponent: React.FC = () => {
  const { data, loading, error, networkStatus } = useQuery(QUERY_ALL_DECKS, {
    notifyOnNetworkStatusChange: true,
    errorPolicy: 'all',
    fetchPolicy: 'cache-and-network'
  });

  console.log('Debug Component State:', {
    data,
    loading,
    error,
    networkStatus,
    apolloClient: 'Check if client is working'
  });

  // Also test the server connection
  React.useEffect(() => {
    console.log('Testing server connection...');
    fetch('/graphql', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query: `
          query {
            getAllDecks {
              _id
              title
              description
            }
          }
        `
      })
    })
    .then(response => response.json())
    .then(result => {
      console.log('Direct fetch result:', result);
    })
    .catch(fetchError => {
      console.error('Direct fetch error:', fetchError);
    });
  }, []);

  return (
    <div style={{ padding: '20px', fontFamily: 'monospace' }}>
      <h1>GraphQL Debug Console</h1>
      
      <div style={{ marginBottom: '20px' }}>
        <h2>Apollo Client Status:</h2>
        <p><strong>Loading:</strong> {loading.toString()}</p>
        <p><strong>Network Status:</strong> {networkStatus}</p>
        
        {error && (
          <div style={{ color: 'red', marginTop: '10px' }}>
            <h3>Error Details:</h3>
            <p><strong>Message:</strong> {error.message}</p>
            <p><strong>Network Error:</strong> {error.networkError?.message || 'None'}</p>
            
            {error.graphQLErrors.length > 0 && (
              <div>
                <p><strong>GraphQL Errors:</strong></p>
                <pre>{JSON.stringify(error.graphQLErrors, null, 2)}</pre>
              </div>
            )}
          </div>
        )}
      </div>

      <div style={{ marginBottom: '20px' }}>
        <h2>Data Received:</h2>
        {data ? (
          <div>
            <p><strong>Success!</strong> Received data:</p>
            <pre style={{ 
              background: '#f5f5f5', 
              padding: '10px', 
              borderRadius: '4px',
              overflow: 'auto',
              maxHeight: '300px'
            }}>
              {JSON.stringify(data, null, 2)}
            </pre>
          </div>
        ) : (
          <p>No data received yet...</p>
        )}
      </div>

      <div>
        <h2>Connection Test:</h2>
        <p>Check the browser console for direct fetch results.</p>
        <p>Server should be running at: <code>http://localhost:3001/graphql</code></p>
      </div>
    </div>
  );
};

export default DebugComponent;