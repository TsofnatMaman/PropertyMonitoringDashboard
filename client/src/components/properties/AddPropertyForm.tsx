import { useState } from "react";
import { createProperty } from "../../services/properties.api";
import type { Property } from "../../types/property";
import { isValidApn } from "../../utils/validation";
import Button from "../ui/Button";
import Card from "../ui/Card";

type AddPropertyFormProps = {
  onSuccess?: (property: Property) => Promise<void> | void;
};

export default function AddPropertyForm({ onSuccess }: AddPropertyFormProps) {
  const [apn, setApn] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  function validate() {
    const cleanApn = apn.trim();

    if (!cleanApn) {
      return "APN is required.";
    }

    if (!isValidApn(cleanApn)) {
      return "APN must be numeric and contain at least 6 digits.";
    }

    return "";
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    setError("");
    setSuccess("");

    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }

    setLoading(true);

    try {
      const property = await createProperty({
        apn: apn.trim(),
        description: description.trim() || null,
      });

      setSuccess("Property saved successfully.");
      setApn("");
      setDescription("");
      await onSuccess?.(property);
    } catch (err: any) {
      setError(err?.message || "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card
      title="Add Property"
      subtitle="Track a new property by APN and optional description."
    >
      <form className="form-grid" onSubmit={handleSubmit}>
        <div className="form-field">
          <label htmlFor="apn">APN</label>
          <input
            id="apn"
            value={apn}
            onChange={(e) => setApn(e.target.value)}
            placeholder="e.g. 2654002037"
          />
        </div>

        <div className="form-field">
          <label htmlFor="description">Description</label>
          <input
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="e.g. 9022 N ORION AVE"
          />
        </div>

        {error ? <div className="form-message form-message--error">{error}</div> : null}
        {success ? (
          <div className="form-message form-message--success">{success}</div>
        ) : null}

        <div className="form-actions">
          <Button type="submit" loading={loading}>
            Add Property
          </Button>
        </div>
      </form>
    </Card>
  );
}