"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.dataHelper = void 0;
const calculatePagination = (options) => {
    const defaultLimit = 100000000000000;
    const page = Number(options.page || 1);
    const limit = Number(options.limit || 20 || defaultLimit);
    const skip = (page - 1) * limit;
    const sortBy = options.sortBy || 'createdAt';
    const sortOrder = options.sortOrder || 'desc';
    return {
        page,
        limit,
        skip,
        sortBy,
        sortOrder,
    };
};
const calculateStatistics = (model, queryConditions, paginationOptions, statFields) => __awaiter(void 0, void 0, void 0, function* () {
    const { page, limit } = paginationOptions;
    const total = yield model.countDocuments(queryConditions);
    const statsPromises = statFields.map((_a) => __awaiter(void 0, [_a], void 0, function* ({ field, name }) {
        const stats = yield model.aggregate([
            { $match: queryConditions },
            {
                $group: {
                    _id: `$${field}`,
                    count: { $sum: 1 },
                },
            },
        ]);
        const ratioStats = stats.reduce((acc, { _id, count }) => {
            if (_id) {
                acc[_id] = {
                    count,
                    percentage: ((count / total) * 100).toFixed(2) + '%',
                };
            }
            return acc;
        }, {});
        return { [name]: ratioStats };
    }));
    const statsResults = yield Promise.all(statsPromises);
    const combinedStats = statsResults.reduce((acc, stat) => (Object.assign(Object.assign({}, acc), stat)), {});
    return Object.assign({ page,
        limit,
        total, totalPages: Math.ceil(total / limit) }, combinedStats);
});
exports.dataHelper = {
    calculatePagination,
    calculateStatistics,
};
