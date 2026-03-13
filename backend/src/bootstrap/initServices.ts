import RedisService from "../services/RedisService";
import SocketService from "../services/SocketService";
import type Server from "../Server";

export function initServices(server: Server) {
    RedisService.init(server.Redis);
    SocketService.init(server);
}
