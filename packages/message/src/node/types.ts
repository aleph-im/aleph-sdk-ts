// ------- GET /api/v0/info/public.json -------

export type NodePublicInfo = {
  node_multi_addresses: string[]
}

// ------- GET /api/v0/channels/list.json -------

export type ChannelsListResponse = {
  channels: string[]
}

// ------- GET /version -------

export type VersionResponse = {
  version: string
}
