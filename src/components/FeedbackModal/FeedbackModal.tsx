import { X, Send, MessageSquare } from 'lucide-react';
import { useJsonStore } from '../../store/useJsonStore';
import styles from './FeedbackModal.module.css';
import { useState } from 'react';
import { toast } from 'sonner';

export function FeedbackModal() {
    const { isFeedbackModalOpen, setFeedbackModalOpen } = useJsonStore();
    const [rating, setRating] = useState<string | null>(null);
    const [message, setMessage] = useState('');
    const [email, setEmail] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    if (!isFeedbackModalOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!rating && !message.trim()) {
            toast.error('Please provide a rating or message');
            return;
        }

        setIsSubmitting(true);

        try {
            const formData = new FormData();
            formData.append('rating', rating || 'None');
            formData.append('message', message);
            if (email) formData.append('email', email);

            // Replace this with your actual Formspree ID
            const formId = "mzdpekny";
            const response = await fetch(`https://formspree.io/f/${formId}`, {
                method: 'POST',
                body: formData,
                headers: {
                    'Accept': 'application/json'
                }
            });

            if (response.ok) {
                toast.success('Thank you for your feedback!');
                setFeedbackModalOpen(false);
                setRating(null);
                setMessage('');
                setEmail('');
            } else {
                toast.error('Failed to send feedback. Please try again.');
            }
        } catch (error) {
            toast.error('An error occurred. Please try again.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const emojis = [
        { label: 'Bad', icon: '😞' },
        { label: 'Okay', icon: '😐' },
        { label: 'Good', icon: '🙂' },
        { label: 'Great', icon: '😃' },
        { label: 'Amazing', icon: '🤩' },
    ];

    return (
        <div className={styles.overlay} onClick={() => setFeedbackModalOpen(false)}>
            <div className={styles.modal} onClick={e => e.stopPropagation()}>
                <div className={styles.header}>
                    <div className={styles.titleRow} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <MessageSquare size={20} />
                        <h2>Share Feedback</h2>
                    </div>
                    <button
                        className={styles.closeBtn}
                        onClick={() => setFeedbackModalOpen(false)}
                    >
                        <X size={20} />
                    </button>
                </div>

                <div className={styles.content}>
                    <form onSubmit={handleSubmit} className={styles.form}>
                        <div className={styles.formGroup}>
                            <label className={styles.label}>How was your experience?</label>
                            <div className={styles.ratingContainer}>
                                {emojis.map((emoji) => (
                                    <button
                                        key={emoji.label}
                                        type="button"
                                        className={`${styles.ratingBtn} ${rating === emoji.label ? styles.active : ''}`}
                                        onClick={() => setRating(emoji.label)}
                                        title={emoji.label}
                                    >
                                        {emoji.icon}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className={styles.formGroup}>
                            <label className={styles.label}>What can we improve?</label>
                            <textarea
                                className={styles.textarea}
                                placeholder="Tell us what you like or what's missing..."
                                value={message}
                                onChange={(e) => setMessage(e.target.value)}
                            />
                        </div>

                        <div className={styles.formGroup}>
                            <label className={styles.label}>Email (optional)</label>
                            <input
                                type="email"
                                className={styles.input}
                                placeholder="So we can reply to you..."
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                            />
                            <p className={styles.transparencyText}>
                                We value your privacy. Your feedback is sent directly to our development team to help improve JSON Studio.
                            </p>
                        </div>

                        <button type="submit" className={styles.submitBtn} disabled={isSubmitting}>
                            {isSubmitting ? 'Sending...' : (
                                <>
                                    Send Feedback <Send size={16} />
                                </>
                            )}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
}
