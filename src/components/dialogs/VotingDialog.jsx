import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import { votingAPI } from '../../utils/api';
import { useAuthStore } from '../../store/authStore';
import { playUiSound } from '../../utils/soundUtils';
import './VotingDialog.css';

const VotingDialog = ({ isOpen, onClose, question, optionA, optionB, initialChoice, onVoteSuccess }) => {
    const { user } = useAuthStore();
    const [selectedOption, setSelectedOption] = useState(initialChoice || null);
    const [reason, setReason] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        if (isOpen) {
            setSelectedOption(initialChoice || null);
            setReason('');
            setError('');
        }
    }, [isOpen, initialChoice]);

    const handleSubmit = async () => {
        if (!selectedOption) {
            setError('Por favor selecciona una opción');
            return;
        }
        if (reason.trim().length < 5) {
            setError('Por favor explica brevemente tu razón (mínimo 5 caracteres)');
            return;
        }

        setIsSubmitting(true);
        setError('');

        try {
            const response = await votingAPI.vote({
                choice: selectedOption,
                reason: reason.trim(),
                userId: user?.id,
                phone: user?.phoneNumber
            });

            if (response.data.success) {
                playUiSound('success');
                onVoteSuccess(response.data.results);
                onClose();
            }
        } catch (err) {
            setError(err.response?.data?.error || 'Error al registrar tu voto. Intenta de nuevo.');
            playUiSound('error');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Votación Comunitaria">
            <div className="voting-dialog">
                <p className="voting-dialog-question">{question}</p>

                <div className="voting-dialog-options">
                    <button
                        className={`voting-dialog-option ${selectedOption === 'optionA' ? 'selected' : ''}`}
                        onClick={() => {
                            playUiSound('click');
                            setSelectedOption('optionA');
                            setError('');
                        }}
                    >
                        {selectedOption === 'optionA' && <span className="option-check">✓</span>}
                        <span className="option-icon">👍</span>
                        <span className="option-text">{optionA.text}</span>
                        <span className="option-votes">{optionA.votes} votos</span>
                    </button>

                    <button
                        className={`voting-dialog-option ${selectedOption === 'optionB' ? 'selected' : ''}`}
                        onClick={() => {
                            playUiSound('click');
                            setSelectedOption('optionB');
                            setError('');
                        }}
                    >
                        {selectedOption === 'optionB' && <span className="option-check">✓</span>}
                        <span className="option-icon">👎</span>
                        <span className="option-text">{optionB.text}</span>
                        <span className="option-votes">{optionB.votes} votos</span>
                    </button>
                </div>

                <div className="voting-dialog-reason">
                    <label htmlFor="vote-reason">¿Por qué elegiste esta opción?</label>
                    <textarea
                        id="vote-reason"
                        value={reason}
                        onChange={(e) => {
                            setReason(e.target.value);
                            if (e.target.value.length >= 5) setError('');
                        }}
                        placeholder="Escribe tu razón aquí..."
                        rows={3}
                    />
                </div>

                {error && (
                    <motion.p
                        className="voting-dialog-error"
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                    >
                        {error}
                    </motion.p>
                )}

                <div className="voting-dialog-actions">
                    <Button
                        variant="secondary"
                        onClick={onClose}
                        disabled={isSubmitting}
                    >
                        Cancelar
                    </Button>
                    <Button
                        variant="primary"
                        onClick={handleSubmit}
                        disabled={isSubmitting || !selectedOption}
                    >
                        {isSubmitting ? 'Enviando...' : 'Confirmar Voto'}
                    </Button>
                </div>
            </div>
        </Modal>
    );
};

export default VotingDialog;
