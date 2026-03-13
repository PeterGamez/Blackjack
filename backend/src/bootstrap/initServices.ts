import type Server from "../Server";
import RedisService from "../services/RedisService";
import SocketService from "../services/SocketService";

export function initServices(server: Server) {
    RedisService.init(server.Redis);
    SocketService.init(server);
}
