import { ModelProxy, BaseEngine } from "modelproxy";
import { IProxyCtx } from "modelproxy/out/models/proxyctx";
import { IInterfaceModel } from "modelproxy/out/models/interface";
import { IExecute } from "modelproxy/out/models/execute";
import * as fetch from "isomorphic-fetch";

import { fetchCacheDec } from "./fetch.cache";
import { fetchDec } from "./fetch.decorator";

const defaultHeaders = {
    "Accept": "application/json",
    "Content-Type": "application/json"
};

export class FetchEngine extends BaseEngine {
    /**
     * 初始化中间件
     * 处理参数params，data，header等数据
     */
    public init(): void {
        this.use(async (ctx: IProxyCtx, next: Function) => {
            let formData = new FormData(),
                bodyParams = new URLSearchParams(),
                { executeInfo = {}, instance = {} } = ctx,
                body, headers: any = { "X-Requested-With": "XMLHttpRequest" },
                { timeout = 5000, headers: originHeaders = {}, type = "", fetch: fetchOptions = {} } = executeInfo.settings || {},
                fullPath = this.getFullPath(instance as any, executeInfo);

            // 根据type来设置不同的header
            switch (type) {
                case "params":
                    headers = Object.assign({}, defaultHeaders, headers);
                    body = bodyParams;
                    break;
                case "formdata":
                    body = formData;
                    break;
                default:
                    headers = Object.assign({}, defaultHeaders, headers);
                    body = JSON.stringify(executeInfo.data || {});
                    break;
            }

            headers = Object.assign({}, headers || {}, originHeaders);

            for (const key in executeInfo.data) {
                if (executeInfo.data.hasOwnProperty(key)) {
                    let data = executeInfo.data[key];

                    formData.append(key, data);
                    bodyParams.append(key, data);
                }
            }

            const fetchFunc: () => Promise<any> = fetch.bind(fetch, fullPath, Object.assign({}, {
                body: ["GET", "OPTIONS", "HEAD"].indexOf((instance.method as any).toUpperCase()) === -1 ? body : null,
                credentials: "same-origin",
                headers: headers,
                method: instance.method as any,
            }, fetchOptions));

            // 发送请求
            ctx.result = await fetchDec(fetchCacheDec(fetchFunc, executeInfo, fullPath), timeout);

            await next();
        });
    }

    /**
     * 调用接口代理方法
     * @param   {IInterfaceModel} instance 接口的信息
     * @param   {IExecute}        options  调用接口的参数
     * @returns {Promise<any>}             返回数据
     */
    public async proxy(instance: IInterfaceModel, options: IExecute): Promise<any> {
        const ctx: IProxyCtx = await this.callback()({
            executeInfo: options,
            instance: instance,
        });

        if (ctx.isError) {
            throw ctx.err;
        }

        return ctx.result;
    }
}
