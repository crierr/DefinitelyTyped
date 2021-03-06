// Type definitions for island 0.0.9
// Project: https://github.com/wokim/island
// Definitions by: Wonshik Kim <https://github.com/wokim/>
// Definitions: https://github.com/borisyankov/DefinitelyTyped

/// <reference path="../bluebird/bluebird.d.ts" />
/// <reference path="../mongoose/mongoose.d.ts" />
/// <reference path="../redis/redis.d.ts" />
/// <reference path="../restify/restify.d.ts" />
/// <reference path="../amqplib/amqplib.d.ts" />
/// <reference path="../socket.io/socket.io.d.ts" />
/// <reference path="../commander/commander.d.ts" />
/// <reference path="../debug/debug.d.ts" />
/// <reference path="../bl/bl.d.ts" />

declare module "island" {
  import Promise = require('bluebird');
  import mongoose = require('mongoose');
  import redis = require('redis');
  import restify = require('restify');
  import amqp = require('amqplib/callback_api');
  import io = require('socket.io');
  import debug = require('debug');
  import bl = require('bl');

  export function debug(namespace: string): debug.Debugger;
  export function error(namespace: string): debug.Debugger;
  export var argv: ICommand;

  export interface AMQPAdapterOptions {
    url: string;
    socketOptions?: amqp.SocketOptions;
  }

  export interface MongooseAdapterOptions {
    uri: string;
    connectionOption?: mongoose.ConnectionOption;
  }

  export interface RedisAdapterOptions {
    port: number;
    host: string;
    clientOpts?: redis.ClientOpts;
  }

  export interface RestifyAdapterOptions {
    serverOptions?: restify.ServerOptions;
    middlewares?: restify.RequestHandler[];
    store: ISessionStore;
    port: number;
    secret: string;
  }

  export interface ISessionStore {
    getSession(sid: string): Promise<any>;
    setSession(sid: string, session: any): Promise<any>;
    deleteSession(sid: string): Promise<void>;
  }

  export interface IToken {
    sid: string;
  }

  export interface SocketIOAdapterOptions {
    port: number;
  }

  /**
   * IAbstractAdapter
   * @interface
   */
  export interface IAbstractAdapter {
    adaptee: any;
    initialize(): Promise<void>;
  }

  /**
   * IListenableAdapter
   * @interface
   */
  export interface IListenableAdapter extends IAbstractAdapter {
    listen(): Promise<void>;
  }

  export interface ICommand extends commander.IExportedCommand {
    host: string;
    port: number;
    etcdServer: {
      host: string;
      port: number;
    };
    serviceName: string;
  }

  /**
   * Abstract adapter class for back-end service.
   * @abstract
   * @class
   * @implements IAbstractAdapter
   */
  export class AbstractAdapter<T, U> implements IAbstractAdapter {
    protected _adaptee: T;
    protected _options: U;
    adaptee: T;
    protected options: U;
    constructor(options?: U);
    /**
     * @abstract
     * @returns {Promise<any>}
     */
    initialize(): Promise<void>;
  }

  /**
   * Abstract adapter class for back-end service.
   * @abstract
   * @class
   * @extends AbstractAdapter
   * @implements IListenableAdapter
   */
  export class ListenableAdapter<T, U> extends AbstractAdapter<T, U> implements IListenableAdapter {
    private _controllers;
    /**
     * @param {AbstractController} Class
     */
    registerController(Class: typeof AbstractController): void;
    /**
     * @returns {Promise<void>}
     * @final
     */
    postInitialize(): Promise<void>;
    /**
     * @abstract
     * @returns {Promise<void>}
     */
    listen(): Promise<void>;
  }

  export class AMQPAdapter extends AbstractAdapter<amqp.Channel, AMQPAdapterOptions> {
    /**
     * @returns {Promise<void>}
     * @override
     */
    initialize(): Promise<void>;
  }

  /**
   * MongooseAdapterType
   * @interface
   */
  export interface MongooseAdapterType {
    connection: mongoose.Connection;
    schemaClass: typeof mongoose.Schema;
  }

  /**
   * MongooseAdapter
   * @class
   * @extends AbstractAdapter<T>
   */
  export class MongooseAdapter extends AbstractAdapter<MongooseAdapterType, MongooseAdapterOptions> {
    /**
     * Initialize the mongoose connection.
     * @returns {Promise<void>}
     * @override
     */
    initialize(): Promise<void>;
  }

  /**
   * PushAdapter
   * @class
   * @extends AbstractAdapter<T>
   */
  export class PushAdapter extends AbstractAdapter<PushService, AMQPAdapterOptions> {
    /**
     * @returns {Promise<void>}
     * @override
     */
    initialize(): Promise<void>;
  }

  /**
   * RedisConnectionAdapter
   * @class
   * @extends AbstractAdapter<T>
   */
  export class RedisConnectionAdapter extends AbstractAdapter<redis.RedisClient, RedisAdapterOptions> {
    /**
     * Initialize the redis connection.
     * @returns {Promise<void>}
     * @override
     */
    initialize(): Promise<void>;
  }

  /**
   * RestifyAdapter
   * @class
   * @extends ListenableAdapter
   */
  export class RestifyAdapter extends ListenableAdapter<restify.Server, RestifyAdapterOptions> {
    /**
     * Initialize the restify server.
     * @override
     * @returns {Promise<void>}
     */
    initialize(): Promise<void>;
    /**
     * Listen the restify server.
     * @override
     * @returns {Promise<void>}
     */
    listen(): Promise<void>;
  }

  export class RPCAdapter extends ListenableAdapter<RPCService, AMQPAdapterOptions> {
    /**
     * @returns {Promise<void>}
     * @override
     */
    initialize(): Promise<void>;
    listen(): Promise<void>;
  }

  export class SocketIOAdapter extends ListenableAdapter<SocketIO.Server, SocketIOAdapterOptions> {
    /**
     * @returns {Promise<void>}
     * @override
     */
    initialize(): Promise<void>;
    /**
     * @override
     * @returns {Promise<void>}
     */
    listen(): Promise<void>;
  }

  /**
   * Create a new Islet.
   * @abstract
   * @class
   */
  export class Islet {
    private static islet;
    /**
     * Register the islet which is the suite of micro-service
     * @param {Islet} islet
     * @static
     */
    private static registerIslet(islet);
    /**
     * Retrieves a registered micro-service.
     * @returns {Microservice}
     * @static
     */
    static getIslet(): Islet;
    static getIslet<T>(): T;
    /**
     * Instantiate and run a microservice.
     * @param {Microservice} Class
     * @static
     */
    static run(Class: typeof Islet): Promise<any[]>;
    static run(config: Promise<any>, Class: typeof Islet): Promise<any[]>;
    /** @type {Object.<string, IAbstractAdapter>} [adapters={}] */
    private adapters;
    /**
     * Register the adapter.
     * @param {string} name
     * @param {IAbstractAdapter} adapter
     */
    registerAdapter(name: string, adapter: IAbstractAdapter): void;
    /**
     * @param {string} name
     * @returns {typeof Adapter}
     */
    getAdaptee<T>(name: string): T;
    getAdaptee(name: string): any;
    /**
     * @abstract
     * @param {any} config
     */
    main(config: any): void;
    /**
     * @returns {Promise<void>}
     */
    initialize(): Promise<any[]>;
    /**
     * @returns {Promise<void>}
     */
    start(): Promise<void[]>;
  }

  /**
   * AbstractController<T>
   * @abstract
   * @class
   */
  export class AbstractController<T> {
    private _server;

    /**
     * Connect your own controller here.
     * @constructs
     * @param {T} server
     */
    constructor(server: T);
    /**
     * @returns {T}
     */
    protected server: T;
    /**
     * @abstract
     * @returns {Promise<void>}
     */
    initialize(): Promise<void>;
  }

  /**
   * ModelFactory
   * @class
   */
  export class ModelFactory {
    private static models;

    /**
     * Retrieves the model of given type.
     * @param {any} Class
     * @returns {any}
     */
    static get<T>(Class: any): T;
    static get(Class: any): any;
  }

  /**
   * PushService
   * @class
   */
  export class PushService {
    private channel;
    constructor(channel: amqp.Channel);
    send(id: string, msg: any): Promise<void>;
    broadcast(msg: any): Promise<void>;
  }

  /**
   * RPCService
   * @class
   */
  export class RPCService {
    private conn;
    private channel;
    private msgpack;
    constructor(conn: amqp.Connection, channel: amqp.Channel);
    register(name: string, handler: (msg: any) => Promise<any>): Promise<void>;
    invoke<T, U>(name: string, msg: T): Promise<U>;
    invoke(name: string, msg: any): any;
  }

  export class MessagePack {
    private static instance;
    private static msgpack;
    constructor();
    static getInst(): MessagePack;
    encode(obj: any): bl;
    decode<T>(buf: Buffer): T;
    decode<T>(buf: bl): T;
  }
}
