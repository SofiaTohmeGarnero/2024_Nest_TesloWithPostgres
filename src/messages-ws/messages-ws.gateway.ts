import {
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { MessagesWsService } from './messages-ws.service';
import { Server, Socket } from 'socket.io';
import { NewMessageDto } from './dto/new-message.dto';
import { JwtService } from '@nestjs/jwt';
import { JwtPayload } from 'src/auth/interfaces';

@WebSocketGateway({ cors: true })
export class MessagesWsGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer() wss: Server;

  constructor(
    private readonly messagesWsService: MessagesWsService,
    private readonly jwtService: JwtService,
  ) {}

  async handleConnection(client: Socket) {
    //console.log('Cliente conectado:', client );
    
    const token = client.handshake.headers.authentication as string;
    let payload: JwtPayload;

    try{
      payload = this.jwtService.verify(token);
      await this.messagesWsService.registerClient(client, payload.id);
    }catch(error){
      client.disconnect();
      return;
    }
    //console.log({payload})
    this.wss.emit(
      'clients-updated',
      this.messagesWsService.getConnectedClients(),
    );
  }

  handleDisconnect(client: Socket) {
    //console.log('Cliente desconectado', client.id );

    this.messagesWsService.removeClient(client.id);
    this.wss.emit(
      'clients-updated',
      this.messagesWsService.getConnectedClients(),
    );
  }

  //CHAT 2° PASO: aca el server se suscribe (escucha) los msjs que llegan desde los clientes
  //y planteamos varias maneras en las que el server le puede contestar a el/los clientes
  @SubscribeMessage('message-from-client')
  onMessageFromClient(client: Socket, payload: NewMessageDto) {
    //console.log(client.id, {payload})

    //! Emite únicamente al cliente que mandó el mensaje.
    /* client.emit('message-from-server', {
      fullName: 'Soy Yo!',
      message: payload.message || 'no-message!!'
    }); */

    //! Emitir a todos MENOS, al cliente inicial (el cliente que manda el mensaje)
    /* client.broadcast.emit('message-from-server', {
      fullName: 'Soy Yo!',
      message: payload.message || 'no-message!!'
    }); */

    //! Emite a todos los clientes el mensaje, inclusive al que lo mandó.
    this.wss.emit('message-from-server', {
      fullName: this.messagesWsService.getUserFullName(client.id),
      message: payload.message || 'no-message!!',
    });
  }
}
