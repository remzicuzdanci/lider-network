using System.Text.Json.Serialization;

namespace LiderCollector.Modules.Virtualization;

// ── Full sync payload sent to /api/v1/collector/virt/inventory ───────────────

public sealed class VirtSyncPayload
{
    [JsonPropertyName("platform")]       public string Platform { get; set; } = "";
    [JsonPropertyName("connection_ref")] public string ConnectionRef { get; set; } = "";
    [JsonPropertyName("collected_at")]   public string CollectedAt { get; set; } = "";
    [JsonPropertyName("sync_type")]      public string SyncType { get; set; } = "full"; // full | delta
    [JsonPropertyName("hosts")]          public List<VirtHostData> Hosts { get; set; } = new();
    [JsonPropertyName("vms")]            public List<VirtVmData> VMs { get; set; } = new();
    [JsonPropertyName("datastores")]     public List<VirtDatastoreData> Datastores { get; set; } = new();
    [JsonPropertyName("networks")]       public List<VirtNetworkData> Networks { get; set; } = new();
    [JsonPropertyName("errors")]         public List<string> Errors { get; set; } = new();
}

// ── Hypervisor host ───────────────────────────────────────────────────────────

public sealed class VirtHostData
{
    /// <summary>Platform-native stable identifier.
    /// VMware: MoRef (e.g. "host-12"). Hyper-V: server FQDN or GUID.</summary>
    [JsonPropertyName("platform_id")]      public string PlatformId { get; set; } = "";

    [JsonPropertyName("name")]             public string Name { get; set; } = "";
    [JsonPropertyName("fqdn")]             public string? Fqdn { get; set; }

    [JsonPropertyName("cpu_model")]        public string? CpuModel { get; set; }
    [JsonPropertyName("cpu_sockets")]      public int? CpuSockets { get; set; }
    [JsonPropertyName("cpu_cores_total")]  public int? CpuCoresTotal { get; set; }
    [JsonPropertyName("cpu_threads_total")]public int? CpuThreadsTotal { get; set; }
    [JsonPropertyName("cpu_total_mhz")]    public long? CpuTotalMhz { get; set; }
    [JsonPropertyName("cpu_usage_mhz")]    public long? CpuUsageMhz { get; set; }

    [JsonPropertyName("ram_total_gb")]     public double? RamTotalGb { get; set; }
    [JsonPropertyName("ram_usage_gb")]     public double? RamUsageGb { get; set; }

    [JsonPropertyName("hypervisor_version")] public string? HypervisorVersion { get; set; }
    [JsonPropertyName("build_version")]    public string? BuildVersion { get; set; }
    [JsonPropertyName("status")]           public string? Status { get; set; } // connected|disconnected|maintenance

    [JsonPropertyName("cluster_name")]     public string? ClusterName { get; set; }
    [JsonPropertyName("datacenter_name")]  public string? DatacenterName { get; set; }

    [JsonPropertyName("platform_data")]    public Dictionary<string, object?>? PlatformData { get; set; }
}

// ── Virtual machine ───────────────────────────────────────────────────────────

public sealed class VirtVmData
{
    // ── Identifiers — stored separately, NO merging on single field alone ────
    /// <summary>VMware: vmUUID (vCenter summary.config.uuid).
    /// Hyper-V: VM GUID (MSVM_ComputerSystem.Name).</summary>
    [JsonPropertyName("vm_uuid")]          public string VmUuid { get; set; } = "";

    /// <summary>VMware only: instanceUUID (summary.config.instanceUuid). Null for Hyper-V.</summary>
    [JsonPropertyName("instance_uuid")]    public string? InstanceUuid { get; set; }

    /// <summary>VMware: config.uuid (BIOS UUID shown in guest as Win32_ComputerSystemProduct).
    /// Hyper-V: BIOSGuid from MSVM_BIOSElement. Used to cross-link with C# Collector data.</summary>
    [JsonPropertyName("bios_uuid")]        public string? BiosUuid { get; set; }

    /// <summary>VMware only: Managed Object Reference (e.g. "vm-42"). Opaque platform handle.</summary>
    [JsonPropertyName("moref")]            public string? Moref { get; set; }

    [JsonPropertyName("host_platform_id")] public string? HostPlatformId { get; set; }

    // ── Basic info ──────────────────────────────────────────────────────────
    [JsonPropertyName("name")]             public string Name { get; set; } = "";
    [JsonPropertyName("power_state")]      public string PowerState { get; set; } = "unknown";
    [JsonPropertyName("guest_os")]         public string? GuestOs { get; set; }
    [JsonPropertyName("guest_hostname")]   public string? GuestHostname { get; set; }
    [JsonPropertyName("guest_ip")]         public string? GuestIp { get; set; }
    [JsonPropertyName("tools_status")]     public string? ToolsStatus { get; set; }

    // ── Resources ───────────────────────────────────────────────────────────
    [JsonPropertyName("vcpu_count")]       public int? VcpuCount { get; set; }
    [JsonPropertyName("ram_mb")]           public long? RamMb { get; set; }
    [JsonPropertyName("cpu_usage_mhz")]    public long? CpuUsageMhz { get; set; }
    [JsonPropertyName("ram_usage_mb")]     public long? RamUsageMb { get; set; }

    // ── Disks ────────────────────────────────────────────────────────────────
    [JsonPropertyName("disks")]            public List<VirtDiskData> Disks { get; set; } = new();
    [JsonPropertyName("snapshot_count")]   public int SnapshotCount { get; set; }
    [JsonPropertyName("oldest_snapshot_days")] public int? OldestSnapshotDays { get; set; }
    [JsonPropertyName("snapshots")]        public List<VirtSnapshotData> Snapshots { get; set; } = new();

    // ── Networks ─────────────────────────────────────────────────────────────
    [JsonPropertyName("nics")]             public List<VirtNicData> Nics { get; set; } = new();

    [JsonPropertyName("platform_data")]    public Dictionary<string, object?>? PlatformData { get; set; }
}

// ── Disk attached to a VM ─────────────────────────────────────────────────────

public sealed class VirtDiskData
{
    [JsonPropertyName("label")]            public string? Label { get; set; }
    [JsonPropertyName("datastore_id")]     public string? DatastoreId { get; set; }
    [JsonPropertyName("size_gb")]          public double? SizeGb { get; set; }
    [JsonPropertyName("used_gb")]          public double? UsedGb { get; set; }
    [JsonPropertyName("thin_provisioned")] public bool ThinProvisioned { get; set; }
    [JsonPropertyName("disk_type")]        public string? DiskType { get; set; } // vmdk | vhd | vhdx
}

// ── VM snapshot ───────────────────────────────────────────────────────────────

public sealed class VirtSnapshotData
{
    [JsonPropertyName("name")]             public string? Name { get; set; }
    [JsonPropertyName("created_at")]       public string? CreatedAt { get; set; }
    [JsonPropertyName("size_gb")]          public double? SizeGb { get; set; }
    [JsonPropertyName("is_current")]       public bool IsCurrent { get; set; }
}

// ── NIC attached to a VM ──────────────────────────────────────────────────────

public sealed class VirtNicData
{
    [JsonPropertyName("mac_address")]      public string? MacAddress { get; set; }
    [JsonPropertyName("network_id")]       public string? NetworkId { get; set; }
    [JsonPropertyName("adapter_type")]     public string? AdapterType { get; set; } // e1000e | vmxnet3 | ...
    [JsonPropertyName("connected")]        public bool Connected { get; set; }
}

// ── Datastore ─────────────────────────────────────────────────────────────────

public sealed class VirtDatastoreData
{
    [JsonPropertyName("datastore_id")]     public string DatastoreId { get; set; } = "";
    [JsonPropertyName("name")]             public string Name { get; set; } = "";
    [JsonPropertyName("type")]             public string? Type { get; set; } // VMFS | NFS | vSAN | CSV | SMB
    [JsonPropertyName("capacity_gb")]      public double? CapacityGb { get; set; }
    [JsonPropertyName("free_gb")]          public double? FreeGb { get; set; }
    [JsonPropertyName("vm_count")]         public int? VmCount { get; set; }
    [JsonPropertyName("accessible")]       public bool Accessible { get; set; } = true;
}

// ── Virtual network / port group ──────────────────────────────────────────────

public sealed class VirtNetworkData
{
    [JsonPropertyName("network_id")]       public string NetworkId { get; set; } = "";
    [JsonPropertyName("name")]             public string Name { get; set; } = "";
    [JsonPropertyName("type")]             public string? Type { get; set; } // standard_vswitch | dvs | hyperv_switch
    [JsonPropertyName("vlan_id")]          public int? VlanId { get; set; }
    [JsonPropertyName("accessible")]       public bool Accessible { get; set; } = true;
}

// ── Per-metric performance sample ─────────────────────────────────────────────

public sealed class VirtPerformanceMetric
{
    [JsonPropertyName("entity_type")]  public string EntityType { get; set; } = "vm"; // vm | host
    [JsonPropertyName("entity_id")]    public string EntityId { get; set; } = "";
    [JsonPropertyName("metric")]       public string Metric { get; set; } = ""; // cpu_usage_pct | ram_usage_pct | ...
    [JsonPropertyName("value")]        public double Value { get; set; }
    [JsonPropertyName("recorded_at")]  public string RecordedAt { get; set; } = "";
}
