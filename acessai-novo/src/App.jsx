import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMapEvents, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css'; 
import { Locate, Trash2 } from 'lucide-react'; 
import L from 'leaflet';

// --- IMPORTAÇÃO DO FIREBASE ---
import { db } from './firebaseConfig';
import { collection, addDoc, onSnapshot, query, orderBy, deleteDoc, doc } from 'firebase/firestore';

// --- 1. CONFIGURAÇÃO (Mantive igual) ---
const opcoesDeficiencia = {
  motora: { titulo: "Motora", cor: "#e74c3c", emojiCategoria: "♿", problemas: [{ id: 'rampa', nome: 'Falta de Rampa', emoji: 'slope' }, { id: 'buraco', nome: 'Buraco na Calçada', emoji: '🕳️' }, { id: 'estreita', nome: 'Calçada Estreita', emoji: '📏' }, { id: 'estacionamento', nome: 'Vaga Ocupada', emoji: '🚗' }] },
  visual: { titulo: "Visual", cor: "#f1c40f", emojiCategoria: "👁️", problemas: [{ id: 'piso', nome: 'Falta Piso Tátil', emoji: '🟦' }, { id: 'braile', nome: 'Falta de Braile', emoji: '⠃' }, { id: 'orelhao', nome: 'Orelhão/Objeto Suspenso', emoji: '⚠️' }, { id: 'semaforo', nome: 'Semáforo Sonoro Quebrado', emoji: '🚦' }] },
  auditiva: { titulo: "Auditiva", cor: "#3498db", emojiCategoria: "👂", problemas: [{ id: 'interprete', nome: 'Falta de Intérprete', emoji: '👋' }, { id: 'sinalizacao', nome: 'Falta Sinalização Visual', emoji: '👀' }, { id: 'aviso', nome: 'Sem Aviso Luminoso', emoji: '🚨' }] },
  cognitiva: { titulo: "Cognitiva", cor: "#9b59b6", emojiCategoria: "🧠", problemas: [{ id: 'placa', nome: 'Placas Confusas', emoji: '❓' }, { id: 'estimulo', nome: 'Excesso de Barulho/Luz', emoji: '⚡' }, { id: 'informacao', nome: 'Informação Complexa', emoji: '📚' }] }
};

const criarIcone = (emoji, cor) => {
  return L.divIcon({
    html: `<div style="background-color: ${cor}; color: white; border-radius: 50%; width: 35px; height: 35px; display: flex; align-items: center; justify-content: center; font-size: 20px; border: 2px solid white; box-shadow: 0 2px 5px rgba(0,0,0,0.3);">${emoji}</div>`,
    className: 'custom-marker',
    iconSize: [35, 35],
    iconAnchor: [17, 35]
  });
};

// --- 2. COMPONENTES AUXILIARES ---
function ControladorDeCliques({ aoClicar }) {
  useMapEvents({ click(e) { aoClicar(e.latlng); } });
  return null;
}

function BotaoLocalizacao() {
  const map = useMap();
  const buscarLocalizacao = () => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => map.flyTo([pos.coords.latitude, pos.coords.longitude], 17),
      () => alert("Erro ao buscar localização")
    );
  };
  return (
    <div className="leaflet-top leaflet-right">
      <div className="leaflet-control leaflet-bar">
        <button onClick={buscarLocalizacao} style={{ width: '40px', height: '40px', cursor: 'pointer', background: 'white', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center' }} title="Minha Localização">
          <Locate size={24} color="#333" />
        </button>
      </div>
    </div>
  );
}

// --- 3. APLICATIVO PRINCIPAL ---
function App() {
  const [pontos, setPontos] = useState([]); 
  const [categoriaAtiva, setCategoriaAtiva] = useState('motora');
  const [problemaAtivo, setProblemaAtivo] = useState(opcoesDeficiencia['motora'].problemas[0]);

  // --- CONEXÃO COM O FIREBASE (COM O DETECTOR DE ERROS) ---
  useEffect(() => {
    // Busca os dados ordenados por data
    const q = query(collection(db, "pontos"), orderBy("data", "desc"));
    
    // Inicia a escuta em tempo real
    const unsubscribe = onSnapshot(q, 
      (querySnapshot) => {
        // SUCESSO: Atualiza a lista
        const listaAtualizada = [];
        querySnapshot.forEach((doc) => {
          listaAtualizada.push({ id_firebase: doc.id, ...doc.data() });
        });
        setPontos(listaAtualizada);
      },
      (erro) => {
        // ERRO: Avisa na tela do celular!
        alert("ERRO FIREBASE: " + erro.message);
        console.error("Erro detalhado:", erro);
      }
    );

    return () => unsubscribe();
  }, []);

  // --- FUNÇÕES DE AÇÃO ---
  const adicionarPonto = async (coordenada) => {
    try {
      const dadosCategoria = opcoesDeficiencia[categoriaAtiva];
      await addDoc(collection(db, "pontos"), {
        lat: coordenada.lat,
        lng: coordenada.lng,
        texto: problemaAtivo.nome,
        emoji: problemaAtivo.emoji,
        cor: dadosCategoria.cor,
        categoria: dadosCategoria.titulo,
        data: new Date().toISOString()
      });
    } catch (erro) {
      alert("Erro ao salvar: " + erro.message);
    }
  };

  const apagarPonto = async (id_firebase) => {
    if (confirm("Apagar este alerta para todos?")) {
      try {
        await deleteDoc(doc(db, "pontos", id_firebase));
      } catch (erro) {
        alert("Erro ao apagar: " + erro.message);
      }
    }
  };

  const mudarCategoria = (chave) => {
    setCategoriaAtiva(chave);
    setProblemaAtivo(opcoesDeficiencia[chave].problemas[0]);
  };

  // --- O QUE APARECE NA TELA ---
  return (
    <div style={{ height: '100vh', width: '100vw', display: 'flex', flexDirection: 'column' }}>
      
      {/* MENU SUPERIOR */}
      <div style={{ background: '#2c3e50', padding: '10px', display: 'flex', justifyContent: 'center', gap: '10px', flexWrap: 'wrap' }}>
        {Object.entries(opcoesDeficiencia).map(([chave, dados]) => (
          <button key={chave} onClick={() => mudarCategoria(chave)} style={{ padding: '8px 16px', borderRadius: '20px', border: 'none', cursor: 'pointer', fontWeight: 'bold', background: categoriaAtiva === chave ? dados.cor : '#bdc3c7', color: categoriaAtiva === chave ? 'white' : '#2c3e50', transform: categoriaAtiva === chave ? 'scale(1.1)' : 'scale(1)', transition: 'all 0.2s' }}>
            {dados.emojiCategoria} {dados.titulo}
          </button>
        ))}
      </div>

      {/* MENU INFERIOR */}
      <div style={{ background: '#ecf0f1', padding: '10px', display: 'flex', justifyContent: 'center', gap: '10px', borderBottom: '2px solid #bdc3c7', flexWrap: 'wrap' }}>
        <span style={{ fontWeight: 'bold', marginRight: '10px', alignSelf: 'center' }}>Problema:</span>
        {opcoesDeficiencia[categoriaAtiva].problemas.map((problema) => (
          <button key={problema.id} onClick={() => setProblemaAtivo(problema)} style={{ padding: '8px', border: problemaAtivo.id === problema.id ? `2px solid ${opcoesDeficiencia[categoriaAtiva].cor}` : '1px solid #ccc', backgroundColor: problemaAtivo.id === problema.id ? 'white' : '#f9f9f9', borderRadius: '5px', cursor: 'pointer', fontWeight: problemaAtivo.id === problema.id ? 'bold' : 'normal' }}>
            {problema.emoji} {problema.nome}
          </button>
        ))}
      </div>

      {/* MAPA */}
      <MapContainer center={[-5.915, -35.263]} zoom={13} style={{ flex: 1, width: '100%' }}>
        <TileLayer attribution='&copy; OpenStreetMap' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
        <ControladorDeCliques aoClicar={adicionarPonto} />
        <BotaoLocalizacao />

        {pontos.map((ponto) => (
          <Marker key={ponto.id_firebase} position={[ponto.lat, ponto.lng]} icon={criarIcone(ponto.emoji, ponto.cor)}>
            <Popup>
              <strong style={{ color: ponto.cor }}>{ponto.categoria}</strong> <br/>
              {ponto.emoji} {ponto.texto} <br/>
              <button onClick={() => apagarPonto(ponto.id_firebase)} style={{ marginTop: '10px', background: '#e74c3c', color: 'white', border: 'none', padding: '5px', borderRadius: '3px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px', width: '100%' }}>
                <Trash2 size={12} /> Resolver / Apagar
              </button>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}

export default App;