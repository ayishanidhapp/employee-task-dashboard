import Modal from './Modal';

export default function ConfirmDialog({ title = 'Are you sure?', message, confirmText = 'Delete', busy, onConfirm, onCancel }) {
  return (
    <Modal
      title={title}
      onClose={onCancel}
      footer={
        <>
          <button className="btn" onClick={onCancel}>Cancel</button>
          <button className="btn btn-danger" onClick={onConfirm} disabled={busy}>
            {busy ? 'Working…' : confirmText}
          </button>
        </>
      }
    >
      <p className="muted">{message}</p>
    </Modal>
  );
}
