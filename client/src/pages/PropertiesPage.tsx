import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import AddPropertyForm from "../components/properties/AddPropertyForm";
import PropertiesTable from "../components/properties/PropertiesTable";
import { startSyncProperty } from "../services/monitoring.api";
import { getProperties } from "../services/properties.api";
import type { Property } from "../types/property";

export default function PropertiesPage() {
  const navigate = useNavigate();

  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function loadProperties() {
    try {
      setLoading(true);
      setError("");

      const data = await getProperties();
      setProperties(data);
    } catch (err: any) {
      setError(err?.message || "Failed to load properties.");
    } finally {
      setLoading(false);
    }
  }

  async function handlePropertyCreated(property: Property) {
    try {
      await loadProperties();
      await startSyncProperty(property.apn);
      navigate("/cases");
    } catch (err: any) {
      setError(err?.message || "Failed to start property sync.");
    }
  }

  useEffect(() => {
    void loadProperties();
  }, []);

  return (
    <div className="page-stack">
      <AddPropertyForm
        onSuccess={async (property) => {
          await handlePropertyCreated(property);
        }}
      />

      {loading ? <p>Loading properties...</p> : null}
      {error ? <p className="text-error">{error}</p> : null}

      {!loading && !error ? <PropertiesTable properties={properties} /> : null}
    </div>
  );
}