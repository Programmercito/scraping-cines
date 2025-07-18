import TeleBot from "telebot";
import { Ciudad } from './common';

export class TelegramPublisher {
  private bot: TeleBot;
  private chatId: string;
  private enabled: boolean;

  constructor(token: string, chatId: string, telegram: string) {
    this.bot = new TeleBot({
      token: token,
    });
    this.chatId = chatId;
    this.enabled = telegram === 'true';
  }

  public async publicar(cineData: { ciudades: Ciudad[], cine: string | undefined, fecha: string }, nombreCine: string, fecha: string): Promise<void> {
    if (process.env.DISABLE_TELEGRAM === 'TRUE' || !this.enabled) {
      return;
    }

    for (const ciudad of cineData.ciudades) {
      const ciudadStr = await this.ciudadString(ciudad);
      
      try {
        await this.bot.sendMessage(
          this.chatId, 
          `<b>${nombreCine}</b>\n${fecha}\n${ciudadStr}\n${nombreCine}\n${fecha}`, 
          {
            notification: false,
            parseMode: 'html'
          }
        );
        console.log('Mensaje enviado');
        
        // Espera 1 segundo entre mensajes
        await this.delay(1000);
      } catch (error) {
        console.error('Error al enviar el mensaje:', error);
      }
    }
  }

  private async ciudadString(ciudad: Ciudad): Promise<string> {
    let ciudadString = `Ciudad: ${ciudad.ciudad}\n`;
    for (const pelicula of ciudad.peliculas) {
      ciudadString += `<b>${pelicula.titulo}</b>\n`;
      for (const horario of pelicula.horarios) {
        ciudadString += `${horario.horario} - ${horario.idioma} - ${horario.formato}\n`;
      }
      ciudadString += '\n';
    }
    ciudadString += `Ciudad: ${ciudad.ciudad}\n`;
    return ciudadString;
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
