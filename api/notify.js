// api/notify.js
// Funzione serverless (formato Vercel) che invia un messaggio Telegram al pilota
// quando arriva una nuova prenotazione su Piccioni Airlines.
//
// Deploy consigliato: Vercel (gratuito). Metti questo file in una cartella
// "api/" nella root del progetto: Vercel lo pubblica automaticamente come
// endpoint POST /api/notify.
//
// VARIABILI D'AMBIENTE richieste (da impostare su Vercel, MAI nel codice):
//   TELEGRAM_BOT_TOKEN   -> il token che ti da BotFather quando crei il bot
//   TELEGRAM_CHAT_ID     -> l'id della chat del tuo amico con il bot
//                           (si ottiene una volta sola, vedi README-telegram.md)
//
// Non serve nessun template, nessuna approvazione: il bot puo scrivere
// liberamente a chiunque gli abbia scritto almeno un messaggio (anche solo /start).

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ ok: false, error: 'Metodo non consentito, usa POST.' });
  }

  const { nome, partenza, arrivo, mapsLink } = req.body || {};
  if (!nome || !partenza || !arrivo || !mapsLink) {
    return res.status(400).json({ ok: false, error: 'Mancano dei dati nella prenotazione.' });
  }

  const { TELEGRAM_BOT_TOKEN, TELEGRAM_CHAT_ID } = process.env;

  if (!TELEGRAM_BOT_TOKEN || !TELEGRAM_CHAT_ID) {
    return res.status(500).json({
      ok: false,
      error: 'Variabili d\'ambiente mancanti sul server. Configura TELEGRAM_BOT_TOKEN e TELEGRAM_CHAT_ID.'
    });
  }

  const testo =
    `🕊️ *${nome}* ha prenotato un volo sulla Piccioni Airlines\n` +
    `Da: ${partenza}\n` +
    `A: ${arrivo}\n` +
    `[Apri il tragitto su Maps](${mapsLink})`;

  const url = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`;

  try {
    const tgRes = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: TELEGRAM_CHAT_ID,
        text: testo,
        parse_mode: 'Markdown'
      })
    });
    const data = await tgRes.json();

    if (!tgRes.ok || !data.ok) {
      return res.status(tgRes.status || 500).json({ ok: false, error: data?.description || 'Errore da parte di Telegram.', details: data });
    }

    return res.status(200).json({ ok: true, telegramResponse: data });
  } catch (err) {
    return res.status(500).json({ ok: false, error: 'Errore di rete verso l\'API Telegram: ' + err.message });
  }
}