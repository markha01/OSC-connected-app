// Notes Section Component
import React, { useState, useEffect } from 'react';
import {
  Box,
  TextField,
  Button,
  Typography,
  Paper,
  IconButton,
  Alert,
  CircularProgress,
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  Save as SaveIcon,
  Cancel as CancelIcon,
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
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      {!showAddNote ? (
        <Button
          variant="outlined"
          startIcon={<AddIcon />}
          onClick={() => setShowAddNote(true)}
          fullWidth
          sx={{ mb: 2 }}
        >
          Add Note
        </Button>
      ) : (
        <Box sx={{ mb: 2 }}>
          <TextField
            multiline
            rows={4}
            fullWidth
            placeholder="Write your note here... (e.g., side effects, positive effects, methods that work better, etc.)"
            value={newNoteContent}
            onChange={(e) => setNewNoteContent(e.target.value)}
            sx={{ mb: 1 }}
          />
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button
              variant="contained"
              startIcon={<SaveIcon />}
              onClick={handleAddNote}
              disabled={loading}
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
            >
              Cancel
            </Button>
          </Box>
        </Box>
      )}

      {notes.length === 0 && !loading ? (
        <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 2 }}>
          No notes yet. Add your first note to track side effects, positive outcomes, or helpful methods.
        </Typography>
      ) : (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {notes.map((note) => (
            <Paper
              key={note.id}
              sx={{
                p: 2,
                border: '1px solid',
                borderColor: 'divider',
                position: 'relative',
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
                    sx={{ mb: 1 }}
                  />
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <Button
                      size="small"
                      variant="contained"
                      startIcon={<SaveIcon />}
                      onClick={() => handleEditNote(note.id)}
                      disabled={loading}
                    >
                      Save
                    </Button>
                    <Button
                      size="small"
                      variant="outlined"
                      startIcon={<CancelIcon />}
                      onClick={cancelEditing}
                      disabled={loading}
                    >
                      Cancel
                    </Button>
                  </Box>
                </Box>
              ) : (
                <>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography variant="caption" color="text.secondary">
                      {dateUtils.formatDateTime(note.created_at)}
                    </Typography>
                    <Box>
                      <IconButton
                        size="small"
                        onClick={() => startEditing(note)}
                        disabled={loading}
                      >
                        <EditIcon fontSize="small" />
                      </IconButton>
                      <IconButton
                        size="small"
                        onClick={() => handleDeleteNote(note.id)}
                        disabled={loading}
                      >
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </Box>
                  </Box>
                  <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
                    {note.content}
                  </Typography>
                </>
              )}
            </Paper>
          ))}
        </Box>
      )}
    </Box>
  );
};

export default NotesSection;
