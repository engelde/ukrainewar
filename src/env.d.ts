// Extend the CloudflareEnv interface with our custom KV binding
interface CloudflareEnv {
  CACHE: KVNamespace;
}
