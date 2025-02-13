import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom"; // ✅ Import useNavigate
import "./ExtractedReq.css"; // Import the CSS file

const Extractedreq = () => {
    const [requirements, setRequirements] = useState([]);
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate(); // ✅ Initialize navigate

    useEffect(() => {
        const fetchData = async () => {
            try {
                const token = localStorage.getItem("token"); // Get token from storage

                if (!token) {
                    console.error("❌ No auth token found!");
                    return;
                }

                const response = await fetch("http://localhost:5000/my-extractions/latest", {
                    method: "GET",
                    headers: {
                        "Content-Type": "application/json",
                        "Authorization": `Bearer ${token}`
                    }
                });

                if (!response.ok) {
                    throw new Error(`HTTP Error! Status: ${response.status}`);
                }

                const data = await response.json();
                console.log("📡 API Response:", data);

                setRequirements(data);
                setLoading(false);
            } catch (error) {
                console.error("❌ Fetch error:", error);
                setError(error.message);
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    // ✅ Function to navigate to Upload Source Code page
    const handleUploadCodeClick = () => {
        navigate("/upload-code"); // ✅ Ensure this route exists in App.js
    };

    return (
        <div className="container">
            <h2 className="title">Extracted Requirements</h2>
            {loading ? (
                <p className="loading">Loading...</p>
            ) : error ? (
                <p className="error">{error}</p>
            ) : (
                <div>
                    <table className="requirements-table">
                        <thead>
                            <tr>
                                <th>Filename</th>
                                <th>Requirement</th>
                                <th>Type</th>
                            </tr>
                        </thead>
                        <tbody>
                            {requirements
                                .filter(req => req.requirement && req.requirement.length > 5) // Filters out broken entries
                                .map((req, index) => (
                                    <tr key={index}>
                                        <td>{req.filename}</td>
                                        <td>{req.requirement}</td>
                                        <td>{req.label}</td>
                                    </tr>
                                ))
                            }
                        </tbody>
                    </table>

                    {/* ✅ Button to navigate to Upload Source Code page */}
                    <button className="upload-code-btn" onClick={handleUploadCodeClick}>
                        Upload Source Code
                    </button>
                </div>
            )}
        </div>
    );
};

export default Extractedreq;
