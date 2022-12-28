<template>
  <div class="modal-body-small" :style="modalStyle">
    <div class="header">
      <div class="toolbar">
        <span class="toolbar-left">
          <span>Network Output</span>
        </span>
        <span class="toolbar-right">
          <span>
            <close-icon
              class="close icon"
              :disabled="portInvalid ? '' : undefined"
              @click="close"
            />
          </span>
        </span>
      </div>
      <div class="limits lil-gui children">
        <div class="settings">
          <div class="settings-label">
            Type:
          </div>
          <ayva-dropdown v-model="connectionType" class="connection-type" :options="connectionTypeOptions" />
        </div>
        <div class="settings">
          <div class="settings-label">
            Host:
          </div>
          <div>
            <!-- <n-tooltip :show="hostInvalid" class="error-tooltip">
              <template #trigger> -->
            <input v-model="host" class="host" :class="hostInvalid ? 'error' : ''">
            <!-- </template>
              Invalid host or IP address.
            </n-tooltip> -->
          </div>
        </div>
        <div class="settings">
          <div class="settings-label">
            Port:
          </div>
          <div>
            <n-tooltip :show="portInvalid" class="error-tooltip">
              <template #trigger>
                <input v-model="port" class="port" :class="portInvalid ? 'error' : ''" maxlength="5" @keydown="restrictNumbers">
              </template>
              Port must be a number between 1 and 65535.
            </n-tooltip>
          </div>
        </div>
        <div class="settings add">
          <button class="ayva-button primary" :disabled="addDisabled" @click="add">
            Add
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import AyvaDropdown from './widgets/AyvaDropdown.vue';

export default {
  components: {
    AyvaDropdown,
  },

  emits: ['close', 'add'],

  data () {
    return {
      connectionTypeOptions: [{
        key: 'websocket',
        label: 'WebSocket',
      }, {
        key: 'udp',
        label: 'UDP',
      }],

      connectionType: '',

      host: null,

      port: '80',
    };
  },

  computed: {
    modalStyle () {
      return { height: '215px' };
    },

    portInvalid () {
      if (this.portBlank) {
        return false;
      }

      const port = Number(this.port);
      return !(Number.isFinite(port) && port >= 1 && port <= 65535);
    },

    portBlank () {
      return !this.port || !this.port.trim();
    },

    hostInvalid () {
      if (this.hostBlank) {
        return false;
      }

      const validHostRegex = /^(([a-zA-Z0-9]|[a-zA-Z0-9][a-zA-Z0-9-]*[a-zA-Z0-9])\.)*([A-Za-z0-9]|[A-Za-z0-9][A-Za-z0-9-]*[A-Za-z0-9])$/;
      const validIp = /^(([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])\.){3}([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])$/;

      return !validHostRegex.test(this.host) && !validIp.test(this.host);
    },

    hostBlank () {
      return !this.host || !this.host.trim();
    },

    addDisabled () {
      return (this.hostBlank || this.hostInvalid || this.portBlank || this.portInvalid || !this.connectionType) ? '' : undefined;
    },
  },

  methods: {
    restrictNumbers (event) {
      const validKeys = ['Backspace', 'Delete', 'ArrowLeft', 'ArrowRight'];

      if (!event.key.match(/[0-9]/) && validKeys.indexOf(event.key) === -1) {
        event.preventDefault();
      }
    },

    close () {
      this.$emit('close');
    },

    add () {
      this.$emit('add', {
        type: this.connectionType,
        host: this.host,
        port: Number(this.port),
      });
    },
  },

};
</script>

<style src="../assets/ayva-modal.css" scoped></style>

<style scoped>
.settings-label {
  display: flex;
  align-items: center;
  font-size: 14px;
  margin-top: -2px;
  justify-content: right;
  padding-right: 10px;
}

.settings {
  display: grid;
  grid-template-columns: 40% 60%;
  padding: 10px 21px 10px 4px;
}

.settings input {
  background: var(--ayva-background-dark) !important;
  padding: 5px;
}

.port {
  width: 36%;
}

.add {
  display: flex;
}

.add button {
  margin-left: auto;
  width: 75px;
  height: 25px;
  font-size: 14px;
}

input {
  height: 24px;
}

</style>
