import { deleteItem } from "../services/api";

export default function ClothingCard({ item, onDelete }) {
  const handleDelete = async () => {
    if (window.confirm("Remove this item?")) {
      await deleteItem(item.id);
      onDelete(item.id);
    }
  };

  return (
    <div className="clothing-card">
      <div className="card-image">
        <img src={item.image_url} alt={item.type} />
      </div>
      <div className="card-body">
        <span className="card-type">{item.type}</span>
        {item.sub_type && <span className="card-subtype">{item.sub_type}</span>}
        <div className="card-meta">
          {item.primary_color && (
            <span className="color-tag">
              <span
                className="color-dot"
                style={{ backgroundColor: item.color_hex || "#ccc" }}
              />
              {item.primary_color}
            </span>
          )}
          {item.pattern && <span className="pattern-tag">{item.pattern}</span>}
        </div>
        {item.season && item.season.length > 0 && (
          <div className="card-seasons">
            {item.season.map((s) => (
              <span key={s} className="season-tag">{s}</span>
            ))}
          </div>
        )}
        <div className="card-actions">
          <span className="worn-count">Worn {item.times_worn}x</span>
          <button onClick={handleDelete} className="btn-delete">Remove</button>
        </div>
      </div>
    </div>
  );
}
