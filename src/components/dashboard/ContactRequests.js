import React, { useState, useEffect, useCallback, useMemo } from "react";
import { supabase } from "../../supabase/supabaseClient";
import moment from "moment";
import { debounce } from "lodash";

const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes in milliseconds

const ContactRequests = () => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [statusFilter, setStatusFilter] = useState("all");
  const [cache, setCache] = useState({
    data: {},
    timestamp: null,
  });

  // Check if cache is valid
  const isCacheValid = useCallback(() => {
    return cache.timestamp && Date.now() - cache.timestamp < CACHE_DURATION;
  }, [cache.timestamp]);

  // Debounced filter handler
  const debouncedFilterChange = useMemo(
    () =>
      debounce((value) => {
        setStatusFilter(value);
      }, 300),
    []
  );

  const fetchContactRequests = useCallback(async () => {
    try {
      setLoading(true);

      // Check cache first
      const cacheKey = statusFilter;
      if (isCacheValid() && cache.data[cacheKey]) {
        setRequests(cache.data[cacheKey]);
        setLoading(false);
        return;
      }

      const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession();

      if (sessionError) throw sessionError;

      if (!session) {
        throw new Error("Not authenticated");
      }

      let query = supabase
        .from("contact_requests")
        .select("*")
        .order("created_at", { ascending: false });

      if (statusFilter !== "all") {
        query = query.eq("status", statusFilter);
      }

      const { data, error } = await query;

      if (error) throw error;

      // Update cache
      setCache((prev) => ({
        data: {
          ...prev.data,
          [cacheKey]: data || [],
        },
        timestamp: Date.now(),
      }));

      setRequests(data || []);
    } catch (error) {
      console.error("Error fetching contact requests:", error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  }, [statusFilter, cache.data, isCacheValid]);

  // Reset cache when it expires
  useEffect(() => {
    if (!isCacheValid()) {
      setCache({ data: {}, timestamp: null });
    }
  }, [isCacheValid]);

  useEffect(() => {
    fetchContactRequests();
  }, [fetchContactRequests]);

  const updateRequestStatus = useCallback(
    async (id, newStatus) => {
      try {
        setLoading(true);

        const { error } = await supabase
          .from("contact_requests")
          .update({ status: newStatus })
          .eq("id", id);

        if (error) throw error;

        await fetchContactRequests();

        if (selectedRequest && selectedRequest.id === id) {
          setSelectedRequest((prev) => ({ ...prev, status: newStatus }));
        }
      } catch (error) {
        console.error("Error updating request status:", error);
        setError(error.message);
      } finally {
        setLoading(false);
      }
    },
    [fetchContactRequests, selectedRequest]
  );

  const deleteRequest = useCallback(
    async (id) => {
      try {
        if (
          !window.confirm(
            "Are you sure you want to delete this request? This action cannot be undone."
          )
        ) {
          return;
        }

        setLoading(true);

        const { error } = await supabase
          .from("contact_requests")
          .delete()
          .eq("id", id);

        if (error) throw error;

        // Clear cache to force a fresh fetch
        setCache({ data: {}, timestamp: null });
        await fetchContactRequests();

        if (selectedRequest && selectedRequest.id === id) {
          setSelectedRequest(null);
        }
      } catch (error) {
        console.error("Error deleting request:", error);
        setError(error.message);
      } finally {
        setLoading(false);
      }
    },
    [fetchContactRequests, selectedRequest]
  );

  const handleViewRequest = useCallback(
    (request) => {
      setSelectedRequest(request);

      if (request.status === "new") {
        updateRequestStatus(request.id, "read");
      }
    },
    [updateRequestStatus]
  );

  const closeRequestDetail = useCallback(() => {
    setSelectedRequest(null);
  }, []);

  const getStatusColor = useCallback((status) => {
    switch (status) {
      case "new":
        return "var(--palatinate)";
      case "read":
        return "var(--caribbean-current)";
      case "replied":
        return "var(--dark-purple)";
      case "archived":
        return "var(--midnight-green-2)";
      default:
        return "var(--midnight-green-2)";
    }
  }, []);

  const getStatusLabel = useCallback((status) => {
    switch (status) {
      case "new":
        return "New";
      case "read":
        return "Read";
      case "replied":
        return "Replied";
      case "archived":
        return "Archived";
      default:
        return status;
    }
  }, []);

  const renderStatusDropdown = useCallback(
    (requestId, currentStatus) => {
      return (
        <select
          value={currentStatus}
          onChange={(e) => updateRequestStatus(requestId, e.target.value)}
          className="status-select"
        >
          <option value="new">New</option>
          <option value="read">Read</option>
          <option value="replied">Replied</option>
          <option value="archived">Archived</option>
        </select>
      );
    },
    [updateRequestStatus]
  );

  if (loading && requests.length === 0) {
    return (
      <div className="dashboard-content-loading">
        <div className="page-spin"></div>
        <p>Loading contact requests...</p>
      </div>
    );
  }

  return (
    <div className="contact-requests-page">
      <div className="dashboard-content-header">
        <h2 className="title">Contact Requests</h2>
        <div className="requests-filter">
          <label>Filter: </label>
          <select
            value={statusFilter}
            onChange={(e) => debouncedFilterChange(e.target.value)}
            className="filter-select"
          >
            <option value="all">All</option>
            <option value="new">New</option>
            <option value="read">Read</option>
            <option value="replied">Replied</option>
            <option value="archived">Archived</option>
          </select>
          <button
            className="refresh-btn"
            onClick={() => {
              setCache({ data: {}, timestamp: null });
              fetchContactRequests();
            }}
          >
            <i className="fa-solid fa-rotate"></i> Refresh
          </button>
        </div>
      </div>

      {error && (
        <div className="alert alert-error">
          <p>{error}</p>
          <button onClick={() => setError(null)}>Close</button>
        </div>
      )}

      <div className="requests-container">
        <div
          className={`requests-list ${selectedRequest ? "with-details" : ""}`}
        >
          {requests.length === 0 && !loading ? (
            <div className="no-requests">
              <i className="fa-solid fa-inbox"></i>
              <p>
                No contact requests{" "}
                {statusFilter !== "all"
                  ? `with "${getStatusLabel(statusFilter)}" status`
                  : ""}
              </p>
            </div>
          ) : (
            <>
              <div className="requests-count">
                <p>Showing {requests.length} requests</p>
              </div>
              <div className="requests-table">
                <table>
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Email</th>
                      <th>Date</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {requests.map((request) => (
                      <tr
                        key={request.id}
                        className={`request-row ${
                          request.status === "new" ? "new-request" : ""
                        }`}
                        onClick={() => handleViewRequest(request)}
                      >
                        <td>{request.name}</td>
                        <td>{request.email}</td>
                        <td>
                          {moment(request.created_at).format(
                            "DD/MM/YYYY HH:mm"
                          )}
                        </td>
                        <td>
                          <span
                            className="status-indicator"
                            style={{
                              backgroundColor: getStatusColor(request.status),
                            }}
                          ></span>
                          {getStatusLabel(request.status)}
                        </td>
                        <td className="actions-cell">
                          <button
                            className="view-btn"
                            title="View Details"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleViewRequest(request);
                            }}
                          >
                            <i className="fa-solid fa-eye"></i>
                          </button>
                          <button
                            className="delete-btn"
                            title="Delete"
                            onClick={(e) => {
                              e.stopPropagation();
                              deleteRequest(request.id);
                            }}
                          >
                            <i className="fa-solid fa-trash"></i>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {loading && (
                <div className="loading-more">
                  <div className="page-spin"></div>
                  <p>Loading...</p>
                </div>
              )}
            </>
          )}
        </div>

        {selectedRequest && (
          <div className="request-details">
            <div className="details-header">
              <h3>Request Details</h3>
              <button className="close-details" onClick={closeRequestDetail}>
                <i className="fa-solid fa-times"></i>
              </button>
            </div>
            <div className="details-content">
              <div className="request-info">
                <div className="info-group">
                  <span className="info-label">Name:</span>
                  <span className="info-value">{selectedRequest.name}</span>
                </div>
                <div className="info-group">
                  <span className="info-label">Email:</span>
                  <span className="info-value">
                    <a href={`mailto:${selectedRequest.email}`}>
                      {selectedRequest.email}
                    </a>
                  </span>
                </div>
                <div className="info-group">
                  <span className="info-label">Submission Date:</span>
                  <span className="info-value">
                    {moment(selectedRequest.created_at).format(
                      "DD/MM/YYYY HH:mm"
                    )}
                  </span>
                </div>
                <div className="info-group">
                  <span className="info-label">Status:</span>
                  <span className="info-value status-dropdown">
                    {renderStatusDropdown(
                      selectedRequest.id,
                      selectedRequest.status
                    )}
                  </span>
                </div>
              </div>
              <div className="message-content">
                <h4>Message:</h4>
                <div className="message-text">{selectedRequest.message}</div>
              </div>
              <div className="request-actions">
                <a
                  href={`mailto:${selectedRequest.email}?subject=Reply: Contact Request`}
                  className="reply-btn"
                  onClick={() =>
                    updateRequestStatus(selectedRequest.id, "replied")
                  }
                >
                  <i className="fa-solid fa-reply"></i> Reply to Message
                </a>
                <button
                  className="archive-btn"
                  onClick={() =>
                    updateRequestStatus(selectedRequest.id, "archived")
                  }
                >
                  <i className="fa-solid fa-box-archive"></i> Archive
                </button>
                <button
                  className="delete-btn"
                  onClick={() => deleteRequest(selectedRequest.id)}
                >
                  <i className="fa-solid fa-trash"></i> Delete
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default React.memo(ContactRequests);
