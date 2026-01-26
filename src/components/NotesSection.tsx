// Notes Section Component
import React, { useState, useEffect } from 'react';
import {
  Box,
  TextField,
  Button,
  Typography,
  IconButton,
  Alert,
  CircularProgress,
  Tooltip,
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  Save as SaveIcon,
  Cancel as CancelIcon,
  StickyNote2 as NoteIcon,
} from '@mui/icons-material';
import type { Note } from '../types';
import { noteService } from '../services/oscDatabase';
import { dateUtils } from '../utils/dateUtils';

interface NotesSectionProps {
  medicationId: string;
}

const NotesSection: React.FC<NotesSectionProps> = ({ medicationId }) => {
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [newNoteContent, setNewNoteContent] = useState('');
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [editingContent, setEditingContent] = useState('');
  const [showAddNote, setShowAddNote] = useState(false);

  useEffect(() => {
    fetchNotes();
  }, [medicationId]);

  const fetchNotes = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await noteService.getByMedicationId(medicationId);
      // Sort by created_at descending (newest first)
      setNotes(data.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load notes');
    } finally {
      setLoading(false);
    }
  };

  const handleAddNote = async () => {
    if (!newNoteContent.trim()) {
      setError('Note content cannot be empty');
      return;
    }

    setLoading(true);
    setError('');
    try {
      await noteService.create({
        medication_id: medicationId,
        content: newNoteContent,
      });
      setNewNoteContent('');
      setShowAddNote(false);
      await fetchNotes();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add note');
    } finally {
      setLoading(false);
    }
  };

  const handleEditNote = async (noteId: string) => {
    if (!editingContent.trim()) {
      setError('Note content cannot be empty');
      return;
    }

    setLoading(true);
    setError('');
    try {
      await noteService.update(noteId, editingContent);
      setEditingNoteId(null);
      setEditingContent('');
      await fetchNotes();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update note');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteNote = async (noteId: string) => {
    if (!window.confirm('Are you sure you want to delete this note?')) {
      return;
    }

    setLoading(true);
    setError('');
    try {
      await noteService.delete(noteId);
      await fetchNotes();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete note');
    } finally {
      setLoading(false);
    }
  };

  const startEditing = (note: Note) => {
    setEditingNoteId(note.id);
    setEditingContent(note.content);
  };

  const cancelEditing = () => {
    setEditingNoteId(null);
    setEditingContent('');
  };

  if (loading && notes.length === 0) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 2 }}>
        <CircularProgress size={24} />
      </Box>
    );
  }

  return (
    <Box>
      {error && (
        <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      {!showAddNote ? (
        <Button
          variant="outlined"
          startIcon={<AddIcon />}
          onClick={() => setShowAddNote(true)}
          fullWidth
          sx={{
            mb: notes.length > 0 ? 2 : 0,
            py: 1.5,
            borderWidth: 2,
            borderStyle: 'dashed',
            borderColor: 'rgba(245, 158, 11, 0.3)',
            color: '#d97706',
            backgroundColor: 'rgba(245, 158, 11, 0.05)',
            '&:hover': {
              borderWidth: 2,
              borderColor: 'rgba(245, 158, 11, 0.5)',
              backgroundColor: 'rgba(245, 158, 11, 0.1)',
            },
          }}
        >
          Add Note
        </Button>
      ) : (
        <Box
          sx={{
            mb: 2,
            p: 2.5,
            borderRadius: 3,
            backgroundColor: 'rgba(245, 158, 11, 0.05)',
            border: '1px solid rgba(245, 158, 11, 0.15)',
          }}
        >
          <TextField
            multiline
            rows={4}
            fullWidth
            placeholder="Write your note here... (e.g., side effects, positive effects, methods that work better, etc.)"
            value={newNoteContent}
            onChange={(e) => setNewNoteContent(e.target.value)}
            sx={{ mb: 2 }}
          />
          <Box sx={{ display: 'flex', gap: 1.5 }}>
            <Button
              variant="contained"
              startIcon={loading ? <CircularProgress size={16} color="inherit" /> : <SaveIcon />}
              onClick={handleAddNote}
              disabled={loading}
              sx={{
                background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                '&:hover': {
                  background: 'linear-gradient(135deg, #d97706 0%, #b45309 100%)',
                },
              }}
            >
              Save Note
            </Button>
            <Button
              variant="outlined"
              startIcon={<CancelIcon />}
              onClick={() => {
                setShowAddNote(false);
                setNewNoteContent('');
              }}
              disabled={loading}
              sx={{
                borderColor: '#e2e8f0',
                color: 'text.secondary',
                '&:hover': {
                  borderColor: '#cbd5e1',
                  backgroundColor: '#f8fafc',
                },
              }}
            >
              Cancel
            </Button>
          </Box>
        </Box>
      )}

      {notes.length === 0 && !loading && !showAddNote ? (
        <Box
          sx={{
            textAlign: 'center',
            py: 4,
            px: 2,
            borderRadius: 3,
            border: '2px dashed #e2e8f0',
            backgroundColor: '#f8fafc',
          }}
        >
          <NoteIcon sx={{ fontSize: 40, color: 'text.disabled', mb: 1 }} />
          <Typography variant="body2" color="text.secondary">
            No notes yet. Add your first note to track side effects or helpful methods.
          </Typography>
        </Box>
      ) : (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {notes.map((note, index) => (
            <Box
              key={note.id}
              sx={{
                p: 2.5,
                borderRadius: 3,
                position: 'relative',
                background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.05) 0%, rgba(251, 191, 36, 0.05) 100%)',
                border: '1px solid rgba(245, 158, 11, 0.15)',
                transition: 'all 0.2s',
                animation: `fadeIn 0.3s ease-out ${index * 0.05}s both`,
                '@keyframes fadeIn': {
                  from: { opacity: 0, transform: 'translateY(10px)' },
                  to: { opacity: 1, transform: 'translateY(0)' },
                },
                '&:hover': {
                  boxShadow: '0 4px 12px rgba(245, 158, 11, 0.1)',
                  borderColor: 'rgba(245, 158, 11, 0.25)',
                },
              }}
            >
              {editingNoteId === note.id ? (
                <Box>
                  <TextField
                    multiline
                    rows={4}
                    fullWidth
                    value={editingContent}
                    onChange={(e) => setEditingContent(e.target.value)}
                    sx={{ mb: 2 }}
                  />
                  <Box sx={{ display: 'flex', gap: 1.5 }}>
                    <Button
                      size="small"
                      variant="contained"
                      startIcon={loading ? <CircularProgress size={14} color="inherit" /> : <SaveIcon />}
                      onClick={() => handleEditNote(note.id)}
                      disabled={loading}
                      sx={{
                        background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                        '&:hover': {
                          background: 'linear-gradient(135deg, #d97706 0%, #b45309 100%)',
                        },
                      }}
                    >
                      Save
                    </Button>
                    <Button
                      size="small"
                      variant="outlined"
                      startIcon={<CancelIcon />}
                      onClick={cancelEditing}
                      disabled={loading}
                      sx={{
                        borderColor: '#e2e8f0',
                        color: 'text.secondary',
                      }}
                    >
                      Cancel
                    </Button>
                  </Box>
                </Box>
              ) : (
                <>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5 }}>
                    <Typography variant="caption" color="text.secondary" fontWeight={500}>
                      {dateUtils.formatDateTime(note.created_at)}
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 0.5 }}>
                      <Tooltip title="Edit note">
                        <IconButton
                          size="small"
                          onClick={() => startEditing(note)}
                          disabled={loading}
                          sx={{
                            color: 'text.secondary',
                            '&:hover': {
                              color: '#f59e0b',
                              backgroundColor: 'rgba(245, 158, 11, 0.1)',
                            },
                          }}
                        >
                          <EditIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Delete note">
                        <IconButton
                          size="small"
                          onClick={() => handleDeleteNote(note.id)}
                          disabled={loading}
                          sx={{
                            color: 'text.secondary',
                            '&:hover': {
                              color: 'error.main',
                              backgroundColor: 'rgba(239, 68, 68, 0.1)',
                            },
                          }}
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </Box>
                  </Box>
                  <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap', lineHeight: 1.6 }}>
                    {note.content}
                  </Typography>
                </>
              )}
            </Box>
          ))}
        </Box>
      )}
    </Box>
  );
};

export default NotesSection;
