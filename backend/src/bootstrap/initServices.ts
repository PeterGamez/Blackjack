import GameService from "../services/GameService";
import RedisService from "../services/RedisService";
import SocketService from "../services/SocketService";
import type Server from "../utils/Server";

export function initServices(server: Server) {
    GameService.init(server);
    RedisService.init(server.Redis);
    SocketService.init(server);
}
