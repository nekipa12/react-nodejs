import express from 'express'
import { MiddlewareCallback, Router, RouteCallback } from '../../../../frameworks/api/core/routers'
import { makeHttpRequest, makeHttpResponse } from '../http'

export const makeRouter = (expressRouter: express.Router): Router => {
  const deleteFunc = (path: string, callback: RouteCallback, middleware?: MiddlewareCallback): Router => {
    if (typeof middleware === 'undefined') {
      return makeRouter(expressRouter.delete(
        path,
        (req, res) => callback(makeHttpRequest(req), makeHttpResponse(res)),
      ))
    }
    return makeRouter(expressRouter.delete(
      path,
      (req, res, next) => middleware(makeHttpRequest(req), makeHttpResponse(res), next),
      (req, res) => callback(makeHttpRequest(req), makeHttpResponse(res)),
    ))
  }

  const get = (path: string, callback: RouteCallback, middleware?: MiddlewareCallback) => {
    if (typeof middleware === 'undefined') {
      return makeRouter(expressRouter.get(
        path,
        (req, res) => callback(makeHttpRequest(req), makeHttpResponse(res)),
      ))
    }
    return makeRouter(expressRouter.get(
      path,
      (req, res, next) => middleware(makeHttpRequest(req), makeHttpResponse(res), next),
      (req, res) => callback(makeHttpRequest(req), makeHttpResponse(res)),
    ))
  }

  const patch = (path: string, callback: RouteCallback, middleware?: MiddlewareCallback) => {
    if (typeof middleware === 'undefined') {
      return makeRouter(expressRouter.patch(
        path,
        (req, res) => callback(makeHttpRequest(req), makeHttpResponse(res)),
      ))
    }
    return makeRouter(expressRouter.patch(
      path,
      (req, res, next) => middleware(makeHttpRequest(req), makeHttpResponse(res), next),
      (req, res) => callback(makeHttpRequest(req), makeHttpResponse(res)),
    ))
  }

  const post = (path: string, callback: RouteCallback, middleware?: MiddlewareCallback) => {
    if (typeof middleware === 'undefined') {
      return makeRouter(expressRouter.post(
        path,
        (req, res) => callback(makeHttpRequest(req), makeHttpResponse(res)),
      ))
    }
    return makeRouter(expressRouter.post(
      path,
      (req, res, next) => middleware(makeHttpRequest(req), makeHttpResponse(res), next),
      (req, res) => callback(makeHttpRequest(req), makeHttpResponse(res)),
    ))
  }

  const put = (path: string, callback: RouteCallback, middleware?: MiddlewareCallback) => {
    if (typeof middleware === 'undefined') {
      return makeRouter(expressRouter.put(
        path,
        (req, res) => callback(makeHttpRequest(req), makeHttpResponse(res)),
      ))
    }
    return makeRouter(expressRouter.patch(
      path,
      (req, res, next) => middleware(makeHttpRequest(req), makeHttpResponse(res), next),
      (req, res) => callback(makeHttpRequest(req), makeHttpResponse(res)),
    ))
  }

  return Object.freeze({
    delete: deleteFunc,
    get,
    patch,
    post,
    put,
  })
}
