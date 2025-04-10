import React, { useState, useEffect } from 'react';
import { supabase } from '../../supabase/supabaseClient';
import moment from 'moment';

const ContactRequests = () => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [statusFilter, setStatusFilter] = useState('all');

  useEffect(() => {
    fetchContactRequests();
  }, [statusFilter]);

  const fetchContactRequests = async () => {
    try {
      setLoading(true);
      
      // Fetch the current session to ensure user is authenticated
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError) throw sessionError;
      
      if (!session) {
        throw new Error('Not authenticated');
      }
      
      let query = supabase
        .from('contact_requests')
        .select('*')
        .order('created_at', { ascending: false });
      
      // Apply filter if needed
      if (statusFilter !== 'all') {
        query = query.eq('status', statusFilter);
      }
      
      const { data, error } = await query;
      
      if (error) throw error;
      
      setRequests(data || []);
    } catch (error) {
      console.error('Error fetching contact requests:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const updateRequestStatus = async (id, newStatus) => {
    try {
      setLoading(true);
      
      const { error } = await supabase
        .from('contact_requests')
        .update({ status: newStatus })
        .eq('id', id);
      
      if (error) throw error;
      
      // Refresh the list
      await fetchContactRequests();
      
      // If viewing a request and it's the one that was updated, refresh the selected request too
      if (selectedRequest && selectedRequest.id === id) {
        setSelectedRequest({ ...selectedRequest, status: newStatus });
      }
      
    } catch (error) {
      console.error('Error updating request status:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const deleteRequest = async (id) => {
    try {
      if (!window.confirm('Are you sure you want to delete this request? This action cannot be undone.')) {
        return;
      }
      
      setLoading(true);
      
      const { error } = await supabase
        .from('contact_requests')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      
      // Refresh the list
      await fetchContactRequests();
      
      // Close the detail view if the deleted request was selected
      if (selectedRequest && selectedRequest.id === id) {
        setSelectedRequest(null);
      }
      
    } catch (error) {
      console.error('Error deleting request:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleViewRequest = (request) => {
    setSelectedRequest(request);
    
    // If the request is new, mark it as read when viewed
    if (request.status === 'new') {
      updateRequestStatus(request.id, 'read');
    }
  };

  const closeRequestDetail = () => {
    setSelectedRequest(null);
  };

  const getStatusColor = (status) => {
    switch(status) {
      case 'new': return 'var(--palatinate)';
      case 'read': return 'var(--caribbean-current)';
      case 'replied': return 'var(--dark-purple)';
      case 'archived': return 'var(--midnight-green-2)';
      default: return 'var(--midnight-green-2)';
    }
  };

  const getStatusLabel = (status) => {
    switch(status) {
      case 'new': return 'New';
      case 'read': return 'Read';
      case 'replied': return 'Replied';
      case 'archived': return 'Archived';
      default: return status;
    }
  };

  const renderStatusDropdown = (requestId, currentStatus) => {
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
  };

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
            onChange={(e) => setStatusFilter(e.target.value)}
            className="filter-select"
          >
            <option value="all">All</option>
            <option value="new">New</option>
            <option value="read">Read</option>
            <option value="replied">Replied</option>
            <option value="archived">Archived</option>
          </select>
          <button className="refresh-btn" onClick={fetchContactRequests}>
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
        <div className={`requests-list ${selectedRequest ? 'with-details' : ''}`}>
          {requests.length === 0 ? (
            <div className="no-requests">
              <i className="fa-solid fa-inbox"></i>
              <p>No contact requests {statusFilter !== 'all' ? `with "${getStatusLabel(statusFilter)}" status` : ''}</p>
            </div>
          ) : (
            <>
              <div className="requests-count">
                <p>Total requests: {requests.length}</p>
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
                    {requests.map(request => (
                      <tr 
                        key={request.id} 
                        className={`request-row ${request.status === 'new' ? 'new-request' : ''}`}
                        onClick={() => handleViewRequest(request)}
                      >
                        <td>{request.name}</td>
                        <td>{request.email}</td>
                        <td>{moment(request.created_at).format('DD/MM/YYYY HH:mm')}</td>
                        <td>
                          <span 
                            className="status-indicator" 
                            style={{ backgroundColor: getStatusColor(request.status) }}
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
                    {moment(selectedRequest.created_at).format('DD/MM/YYYY HH:mm')}
                  </span>
                </div>
                <div className="info-group">
                  <span className="info-label">Status:</span>
                  <span className="info-value status-dropdown">
                    {renderStatusDropdown(selectedRequest.id, selectedRequest.status)}
                  </span>
                </div>
              </div>
              <div className="message-content">
                <h4>Message:</h4>
                <div className="message-text">
                  {selectedRequest.message}
                </div>
              </div>
              <div className="request-actions">
                <a 
                  href={`mailto:${selectedRequest.email}?subject=Reply: Contact Request`} 
                  className="reply-btn"
                  onClick={() => updateRequestStatus(selectedRequest.id, 'replied')}
                >
                  <i className="fa-solid fa-reply"></i> Reply to Message
                </a>
                <button 
                  className="archive-btn"
                  onClick={() => updateRequestStatus(selectedRequest.id, 'archived')}
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

export default ContactRequests;
