import React, { useState, useEffect } from 'react';
import { ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

function App() {
  // --- STATE ---
  const [locations, setLocations] = useState([]);
  const [selectedZip, setSelectedZip] = useState('');
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [sortConfig, setSortConfig] = useState({ key: 'price', direction: 'asc' });
  const [activeTab, setActiveTab] = useState('graph'); 

  // --- FETCH DATA (Kept exactly the same) ---
  useEffect(() => {
    fetch('http://127.0.0.1:8000/api/locations')
      .then((res) => res.json())
      .then((data) => {
        setLocations(data);
        if (data.length > 0) setSelectedZip(data[0].zip_code);
      })
      .catch((err) => setError(err.message));
  }, []);

useEffect(() => {
    if (!selectedZip) return;
    setLoading(true);
    fetch(`http://127.0.0.1:8000/api/listings/${selectedZip}`)
      .then((res) => {
        if (!res.ok) throw new Error(`No active data found for ${selectedZip}`);
        return res.json(); // <-- Fixed the typo here
      })
      .then((data) => {
        setListings(data);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  }, [selectedZip]);

  // --- DERIVED METRICS ---
  const totalListings = listings.length;
  const avgRent = totalListings > 0 ? Math.round(listings.reduce((sum, item) => sum + item.price, 0) / totalListings) : 0;

  // --- SORTING LOGIC ---
  // 1. Function to handle header clicks
  const handleSort = (key) => {
    let direction = 'asc';
    // If we click the same column, reverse the direction
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  // 2. Create a copy of the listings array and sort it
  const sortedListings = [...listings].sort((a, b) => {
    // Handle missing data (like null square footage) so it doesn't break the sort
    const valA = a[sortConfig.key] || 0; 
    const valB = b[sortConfig.key] || 0;

    if (valA < valB) return sortConfig.direction === 'asc' ? -1 : 1;
    if (valA > valB) return sortConfig.direction === 'asc' ? 1 : -1;
    return 0;
  });

  // --- CUSTOM HOVER DOT ---
  const renderActiveShape = (props) => {
    // Recharts passes down the x/y coordinates (cx, cy) of the hovered dot
    const { cx, cy } = props; 
    
    return (
      <circle 
        cx={cx} 
        cy={cy} 
        r={8}               /* Make the dot larger (default is usually 4 or 5) */
        fill="#ef4444"       /* Make it red on hover */
      />
    );
  };

  if (error) return <div style={{ color: 'red', padding: '20px' }}>Error: {error}</div>;

  return (
    <div style={{ padding: '20px', fontFamily: 'sans-serif', maxWidth: '1200px', margin: '0 auto' }}>
      
      {/* GLOBAL HEADER & ZIP SELECTOR */}
      <header style={{ textAlign: 'center', justifyContent: 'between', alignItems: 'center', marginBottom: '20px' }}>
        <div>
          <h1 style={{ margin: '0 0 5px 0' }}>Rent Dashboard</h1>
          <div style={{ marginLeft: 'auto', margin: 30 }}>
          <label htmlFor="zip-select" style={{ marginRight: '10px' }}>Location:</label>
          <select id="zip-select" value={selectedZip} onChange={(e) => setSelectedZip(e.target.value)}>
            {locations.map((loc) => (
              <option key={loc.id} value={loc.zip_code}>{loc.zip_code} - {loc.city}</option>
            ))}
          </select>
        </div>
        </div>
        
      </header>

{/* TAB NAVIGATION BUTTONS */}
      <nav style={{ display: 'flex', gap: '100px', borderBottom: '2px solid #eee', paddingBottom: '10px', marginBottom: '20px' }}>
        {[
          { id: 'graph', label: 'Analytics Graph' },
          { id: 'map', label: 'Map View' },
          { id: 'listings', label: `All Listings (${totalListings})` },
          { id: 'info', label: 'Market Info' }
        ].map((tab) => (
          <button 
            key={tab.id}
            onClick={() => setActiveTab(tab.id)} 
            style={{ 
              padding: '10px 20px', 
              cursor: 'pointer', 
              fontWeight: activeTab === tab.id ? 'bold' : 'normal', 
              border: 'none', 
              background: activeTab === tab.id ? '#e2e8f0' : 'none',
              color: activeTab === tab.id ? 'black': 'white',
              borderRadius: '5px' 
            }}
          >
            {tab.label}
          </button>
        ))}
      </nav>

      {/* CONTENT SECTIONS (CONDITIONAL RENDERING) */}
      {loading ? (
        <div>Loading tab content...</div>
      ) : (
        <main style={{ minHeight: '400px' }}>
          
          {/* TAB 1: GRAPH */}
          {activeTab === 'graph' && (
            <section style={{ border: '1px solid #ccc', padding: '20px', borderRadius: '5px' }}>
              <h2 style={{marginBottom: '20px'}}>Price vs. Square Footage</h2>
              <div style={{ width: '100%', height: '400px' }}>
                <ResponsiveContainer >
                  <ScatterChart margin={{ top: 30, right: 30, bottom: 30, left: 30 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" dataKey="square_footage" name="Size" label={{ value: "Square Footage (sq ft)", position: "insideBottom", offset: -20 }}/>
                    <YAxis type="number" dataKey="price" name="Price" label={{ value: "Rent Price ($)", angle: -90, position: "insideLeft", offset: -20, dy: 50}}/>
                    <Tooltip cursor={false} isAnimationActive={false} />
                    <Scatter name="Properties" data={listings} fill="#2563eb" activeShape={renderActiveShape} />
                  </ScatterChart>
                </ResponsiveContainer>
              </div>
            </section>
          )}

          {/* TAB 2: MAP */}
          {activeTab === 'map' && (
            <section style={{ border: '1px solid #ccc', padding: '20px', borderRadius: '5px', background: '#f1f5f9', display: 'flex', justifyContent: 'center', alignItems: 'center', height: '350px' }}>
              <div style={{ textAlign: 'center', color: '#64748b' }}>
                <h2>Geographic Map Placeholder</h2>
                <p>We will integrate a mapping library (like Leaflet or Google Maps) here using listing latitude/longitude variables.</p>
              </div>
            </section>
          )}

        {/* TAB 3: ALL LISTINGS */}
                  {activeTab === 'listings' && (
                    <section style={{ border: '1px solid #ccc', padding: '20px', borderRadius: '5px' }}>
                      <h2>Active Listings Registry</h2>
                      <table style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse' }}>
                        <thead>
                          <tr style={{ borderBottom: '2px solid #ccc', userSelect: 'none' }}>
                            {/* Make headers clickable and add visual arrows */}
                            <th onClick={() => handleSort('address')} style={{ cursor: 'pointer', padding: '10px 0' }}>
                              Address {sortConfig.key === 'address' ? (sortConfig.direction === 'asc' ? '↑' : '↓') : ''}
                            </th>
                            <th onClick={() => handleSort('bedrooms')} style={{ cursor: 'pointer' }}>
                              Beds/Baths {sortConfig.key === 'bedrooms' ? (sortConfig.direction === 'asc' ? '↑' : '↓') : ''}
                            </th>
                            <th onClick={() => handleSort('square_footage')} style={{ cursor: 'pointer' }}>
                              SqFt {sortConfig.key === 'square_footage' ? (sortConfig.direction === 'asc' ? '↑' : '↓') : ''}
                            </th>
                            <th onClick={() => handleSort('price')} style={{ cursor: 'pointer' }}>
                              Price {sortConfig.key === 'price' ? (sortConfig.direction === 'asc' ? '↑' : '↓') : ''}
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {sortedListings.map((item) => (
                            <tr key={item.id} style={{ borderBottom: '1px solid #eee' }}>
                              <td style={{ padding: '10px 0' }}>{item.address}</td>
                              <td>{item.bedrooms}B / {item.bathrooms}Ba</td>
                              <td>{item.square_footage || '--'} sqft</td>
                              <td style={{ fontWeight: 'bold', color: '#2563eb' }}>${item.price}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </section>
                  )}

          {/* TAB 4: MARKET INFO */}
          {activeTab === 'info' && (
            <section style={{ border: '1px solid #ccc', padding: '20px', borderRadius: '5px' }}>
              <h2>Market Summary Insights</h2>
              <ul>
                <li><strong>Average Monthly Cost:</strong> ${avgRent.toLocaleString()}</li>
                <li><strong>Total Scraped Supply:</strong> {totalListings} properties currently available.</li>
                <li><strong>Data Refresh Integrity:</strong> Database updates managed via daily backend automation scripts.</li>
              </ul>
            </section>
          )}

        </main>
      )}
    </div>
  );
}

export default App;