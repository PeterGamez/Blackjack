import CodeHistoryModel from "../models/CodeHistoryModel";
import CodeModel from "../models/CodeModel";
import GameHistoryModel from "../models/GameHistoryModel";
import PackageModel from "../models/PackageModel";
import PaymentModel from "../models/PaymentModel";
import ProductModel from "../models/ProductModel";
import UserInventoryModel from "../models/UserInventoryModels";
import UserModel from "../models/UserModel";
import type Server from "../utils/Server";

export function initModels(server: Server) {
    CodeHistoryModel.init(server.config.mysql.table.codeHistory, server.DB);
    CodeModel.init(server.config.mysql.table.code, server.DB);
    GameHistoryModel.init(server.config.mysql.table.gameHistory, server.DB);
    PackageModel.init(server.config.mysql.table.package, server.DB);
    PaymentModel.init(server.config.mysql.table.payment, server.DB);
    ProductModel.init(server.config.mysql.table.product, server.DB);
    UserModel.init(server.config.mysql.table.user, server.DB);
    UserInventoryModel.init(server.config.mysql.table.userInventory, server.DB);
}
