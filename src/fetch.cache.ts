
import { BaseFactory } from "modelproxy-ssr";
import { IExecute } from "modelproxy-ssr/out/models/execute";

const promiseFactory = new BaseFactory<Promise<any>>();

/**
 * 为fetch增加cache的功能
 * 返回新的promise
 * @param fetchPromise {Promise<any>} fetch的promise
 * @param options      {IExecute}     请求参数
 * @param fullPath     {string}       请求路径
 * @returns {Promise<any>}
 */
export const fetchCacheDec = (fetchPromise: () => Promise<any>, options: IExecute, fullPath: string) => {
    let { cache = false } = options.settings || {},
        { method = "" } = options.instance || {},
        proKey = fullPath + method;

    // 只有get才能缓存
    if (method.toString().toUpperCase() !== "GET") {
        cache = false;
    }

    // 如果不缓存直接调用方法
    if (!cache) {
        return fetchPromise();
    }

    // 从缓存中提取文档，如果没有，则添加
    const promiseInCache = promiseFactory.get(proKey);

    if (promiseInCache) {
        return promiseInCache;
    }

    promiseFactory.add(proKey, fetchPromise());

    return promiseFactory.get(proKey) as Promise<any>;
};
