import React, { useEffect, useState } from "react";

function Home() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch("http://localhost:5000/api/hello");
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const json = await response.json();
        setData(json);
      } catch (err) {
        setError(err.message || "Error al cargar datos");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) return <div>Cargando datos...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div>
      <p>{data?.msg || "Bienvenido a las orgonitas"}</p>
      <p>Las orgonitas son piezas artesanales compuestas por resina (orgánica), virutas metálicas (inorgánicas) y cuarzo, diseñadas para atraer, limpiar y transmutar la energía negativa (orgón DOR) en positiva (orgón POR). Basadas en los estudios de Wilhelm Reich, se utilizan para armonizar ambientes, mejorar el descanso y proteger contra la radiación electromagnética.</p>
    </div>
  );
}

export default Home;