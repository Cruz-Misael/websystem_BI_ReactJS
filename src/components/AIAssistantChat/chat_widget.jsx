import React, { useState, useEffect } from "react";
import "./chat_widget.css";
import isa_avatar from '../../assets/isa_perfil.png';

const API_BASE_URL = process.env.REACT_APP_API_URL;

export default function ChatWidget() {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState([
    { sender: "bot", text: 
      "Olá! Sou a Isa, assistente virtual da Sebratel. Estou aqui para ajudar você na abertura de chamados para as equipes de TI/Infra, TI/Dados, TI/HelpDesk ou TI/Dev. Lembre-se de que ainda estou em fase beta, portanto posso apresentar algumas falhas. Mesmo assim, farei o possível para oferecer o melhor suporte."
    }
  ]);
  const [input, setInput] = useState("");
  const [typing, setTyping] = useState(false);


  /* ========================================================
     1 — CONECTA SSE AO MONTAR O CHAT
     ======================================================== */
    useEffect(() => {
      const email = localStorage.getItem("userEmail");
      if (!email) return;

      const eventSource = new EventSource(`${API_BASE_URL}/chat/stream/${email}`);

      eventSource.addEventListener("message", (e) => {
        const data = JSON.parse(e.data);
        setMessages((prev) => [...prev, { sender: "bot", text: data.message }]);
        setTyping(false);
      });

      eventSource.addEventListener("ping", () => {});

      return () => eventSource.close();
    }, []);


  /* ========================================================
     2 — ENVIO DA MENSAGEM PARA O N8N
     ======================================================== */
    const sendMessage = async () => {
      if (!input.trim()) return;

      const userMsg = { sender: "user", text: input };
      setMessages((prev) => [...prev, userMsg]);
      setInput("");

      // ativa typing
      setTyping(true);

      try {
        await fetch("https://n8n-prod.sebratel.net.br/webhook/ia_hub_dashboards_bi", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            message: userMsg.text,
            email: localStorage.getItem("userEmail")
          })
        });
        // não desativa aqui! O SSE vai desativar
      } catch {
        setMessages((prev) => [
          ...prev,
          { sender: "bot", text: "Erro ao conectar ao servidor." }
        ]);
        setTyping(false);
      }
    };


  /* ========================================================
     3 — UI DO WIDGET
     ======================================================== */
  return (
    <div className="ia-chat-widget">

    {!open && (
    <div 
        className="chat-floating-wrapper"
        onClick={() => setOpen(true)}
    >
        <button className="chat-floating-btn">💬</button>
        <div className="chat-call-to-action-floating"
        
        onClick={() => setOpen(true)}>
        <a target="_blank" rel="noopener noreferrer">
            Abra seu chamado com a Isa...
        </a>
        </div>
    </div>
    )}


    {open && (
        <div className="chat-box-container">
        <div className="chat-header">
            Assistente IA - Beta
            <span
            style={{ float: "right", cursor: "pointer" }}
            onClick={() => setOpen(false)}
            >✖</span>
        </div>

        <div className="chat-messages">
          {messages.map((m, i) => (
            <div key={i} className={`chat-message ${m.sender}`}>
              {m.sender === "bot" && <img src={isa_avatar} className="avatar" alt="Isa" />}
              <span>{m.text}</span>
            </div>
          ))}

          {typing && (
            <div className="chat-typing">
              <div className="typing-indicator">
                <img src={isa_avatar} className="avatar" alt="Isa" />
                <span></span><span></span><span></span>
              </div>
            </div>
          )}
        </div>


        <div className="chat-footer">
            <input
            className="chat-input"
            placeholder="Digite sua mensagem..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && sendMessage()}
            />
            <button className="chat-send-btn" onClick={sendMessage}>
            ➤
            </button>
        </div>
        </div>
    )}
    </div>

    );
}
