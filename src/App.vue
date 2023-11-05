<template>
  <div class="lil-gui container">
    <div class="toolbar">
      Ayva WebSocket Hub
    </div>
    <div class="setup">
      <div class="port">
        <label :disabled="disableDisconnected">Port:</label>
        <n-tooltip :show="portInvalid" class="error-tooltip">
          <template #trigger>
            <input
              v-model="port"
              class="port"
              :class="portInvalid ? 'error' : ''" maxlength="5"
              :disabled="disableDisconnected"
              @keydown="restrictNumbers"
            >
          </template>
          {{ portInvalidMessage }}
        </n-tooltip>
        <button
          class="toggle-connection"
          :class="toggleConnectionClass"
          :disabled="toggleConnectionDisabled"
          @click="toggleState"
        >
          {{ toggleConnectionLabel }}
        </button>
      </div>
      <div class="add-output">
        <n-dropdown
          placement="bottom-start"
          trigger="click"
          size="small"
          :options="outputOptions"
          :disabled="disableDisconnected"
          @select="selectOutput"
        >
          <span class="ayva-dropdown-input">
            <label :disabled="disableDisconnected">Add Output</label>
            <chevron-dropdown-icon class="chevron" :disabled="disableDisconnected" />
          </span>
        </n-dropdown>
      </div>
    </div>
    <div class="output-table">
      <div class="header">
        <div>
          Enabled
        </div>
        <div>
          Output
        </div>
        <div>
          Status
        </div>
      </div>

      <div class="outputs" :style="{ maxHeight: outputsHeight }">
        <template v-for="(output, index) in outputs" :key="output.name">
          <div class="enabled">
            <ayva-checkbox v-model="output.enabled" @change="toggleOutputEnabled(output.name, $event)" />
          </div>
          <div class="name" :title="output.name">
            <span>{{ output.name }}</span>
          </div>
          <div class="status">
            <div class="connect-status-icon" :class="output.connected ? 'connected' : 'disconnected'" />
            <span>{{ output.connected ? 'Connected' : 'Disconnected' }}</span>
          </div>
          <div class="delete">
            <close-icon class="icon" @click="deleteOutput(index)" />
          </div>
        </template>
      </div>
    </div>
    <div class="footer">
      <div class="loader" :hidden="state !== 'Listening'" />
      <div class="connect-status-icon" :class="state.toLowerCase()" :hidden="state === 'Listening'" />
      <span class="status">{{ state === 'Listening' ? 'Listening...' : state }}</span>
      <div class="support">
        <a target="_blank" href="https://www.patreon.com/soritesparadox">
          <div class="patreon-icon">
            <patreon-icon class="icon" />
          </div>
        </a>
      </div>
    </div>

    <n-modal :show="showNetworkModal" :auto-focus="false">
      <div>
        <div class="lil-gui">
          <ayva-network-modal @close="showNetworkModal = false" @add="addNetworkOutput" />
        </div>
      </div>
    </n-modal>
  </div>
</template>

<script>
import AyvaNetworkModal from './components/AyvaNetworkModal.vue';
import AyvaCheckbox from './components/widgets/AyvaCheckbox.vue';
import Storage from './lib/ayva-storage.js';

const storage = new Storage('settings');

export default {
  components: {
    AyvaNetworkModal,
    AyvaCheckbox,
  },

  data () {
    return {
      port: 8080,
      state: 'Disconnected',
      outputs: [],

      outputOptions: [{
        key: 'network',
        label: 'Network',
      }, {
        key: 'serial',
        label: 'Serial',
        children: [],
      }],

      showNetworkModal: false,

      /* Haha... No */
      appMinHeight: 250,
      minOutputsHeight: 121,
      outputsHeight: '121px',
      portInvalidMessage: '',
    };
  },

  computed: {
    portInvalid () {
      return !!this.portInvalidMessage;
    },

    toggleConnectionClass () {
      return this.state === 'Disconnected' ? 'listen' : '';
    },

    toggleConnectionLabel () {
      return this.state === 'Disconnected' ? 'Start' : 'Stop';
    },

    toggleConnectionDisabled () {
      return !this.outputs.length || this.portInvalid ? '' : undefined;
    },

    disableDisconnected () {
      return this.state !== 'Disconnected' ? '' : undefined;
    },
  },

  watch: {
    port (value) {
      const invalidMessage = 'Port must be a number between 1 and 65535.';

      if (value) {
        const port = Number(value);

        if (Number.isFinite(port) && port >= 1 && port <= 65535) {
          this.portInvalidMessage = '';
          storage.save('port', port);
        } else {
          this.portInvalidMessage = invalidMessage;
        }
      } else {
        this.portInvalidMessage = invalidMessage;
      }
    },

    outputs: {
      deep: true,
      handler () {
        this.saveOutputs();
      },
    },
  },

  mounted () {
    setInterval(this.refreshSerialDevices, 1000);

    window.addEventListener('resize', () => {
      this.outputsHeight = `${this.minOutputsHeight + window.innerHeight - this.appMinHeight}px`;
    });

    window.apiEvents.onConnected(() => {
      this.state = 'Connected';
    });

    window.apiEvents.onDisconnected(() => {
      this.stopServer();
    });

    window.apiEvents.onRestartServer(() => {
      this.startServer();
    });

    window.apiEvents.onOutputConnected((name) => {
      const output = this.outputs.find((o) => o.name === name);

      if (output) {
        output.connected = true;
      }
    });

    window.apiEvents.onOutputDisconnected((name) => {
      const output = this.outputs.find((o) => o.name === name);

      if (output) {
        output.connected = false;
      }
    });

    this.loadOutputs();

    this.port = storage.load('port') || 8080;
  },

  methods: {
    restrictNumbers (event) {
      const validKeys = ['Backspace', 'Delete', 'ArrowLeft', 'ArrowRight'];

      if (!event.key.match(/[0-9]/) && validKeys.indexOf(event.key) === -1) {
        event.preventDefault();
      }
    },

    toggleState () {
      if (this.state === 'Disconnected') {
        this.startServer();
      } else {
        this.stopServer();
      }
    },

    selectOutput (key) {
      if (key === 'network') {
        this.showNetworkModal = true;
      } else if (key.startsWith('serial:')) {
        this.addSerialOutput(key);
      }
    },

    addNetworkOutput (output) {
      this.showNetworkModal = false;

      const prefix = output.type === 'websocket' ? 'ws://' : 'udp://';
      const suffix = output.type === 'websocket' ? '/ws' : '';
      const name = `${prefix}${output.host}:${output.port}${suffix}`;

      if (this.outputs.find((o) => o.name === name)) {
        // No duplicates.
        return;
      }

      const details = {
        host: output.host,
        port: output.port,
      };

      this.outputs.push({
        name,
        details,
        type: output.type,
        enabled: true,
        connected: false,
      });

      window.api.addOutput(output.type, name, details);
    },

    addSerialOutput (name) {
      if (this.outputs.find((o) => o.name === name)) {
        // No duplicates.
        return;
      }

      const type = 'serial';

      const details = {
        path: name.substring(7), // Remove "serial:" prefix...
      };

      this.outputs.push({
        name,
        details,
        type,
        enabled: true,
        connected: false,
      });

      window.api.addOutput(type, name, details);
    },

    deleteOutput (index) {
      const [deletedOutput] = this.outputs.splice(index, 1);

      api.deleteOutput(deletedOutput.name);

      if (this.outputs.length <= 0) {
        this.stopServer();
      }
    },

    startServer () {
      api.startServer(this.port).then(() => {
        this.state = 'Listening';
      }).catch((error) => {
        this.portInvalidMessage = `Could not start server on port ${this.port}.`;

        if (error.message.indexOf('EADDRINUSE') !== -1) {
          this.portInvalidMessage += ' Address already in use.';
        }
      });
    },

    stopServer () {
      api.stopServer().then(() => {
        this.state = 'Disconnected';
      });
    },

    toggleOutputEnabled (name, enabled) {
      api.toggleOutputEnabled(name, enabled);
    },

    refreshSerialDevices () {
      window.api.listSerial().then((devices) => {
        const newOptions = (devices || []).map((device) => ({
          key: `serial:${device.path}`,
          label: device.path,
        }));

        this.outputOptions.find((o) => o.key === 'serial').children = newOptions;
      });
    },

    saveOutputs () {
      const storedOutputs = this.outputs.map((output) => ({
        name: output.name,
        type: output.type,
        details: output.details,
        enabled: output.enabled,
      }));

      storage.save('outputs', storedOutputs);
    },

    loadOutputs () {
      const storedOutputs = storage.load('outputs');

      if (storedOutputs) {
        this.outputs = storedOutputs.map((output) => ({
          ...output,
          connected: false,
        }));

        this.outputs.forEach((output) => {
          // We can't pass a proxied object to Electron so we must use the spread operator on details
          // here to copy to a plain old object...
          window.api.addOutput(output.type, output.name, { ...output.details }, output.enabled);
        });
      }
    },
  },
};
</script>

<style scoped>
  .toolbar {
    -webkit-app-region: drag;
    background-color: black;
    display: flex;
    justify-content: center;
    align-items: center;
    font-weight: bold;
  }

  .container {
    display: grid;
    grid-template-rows: 25px 50px 1fr 30px;
    height: 100vh;
    font-size: 14px;
  }
  .setup {
    display: flex;
    align-items: center;
    padding-left: 20px;
    padding-right: 20px;
  }

  .port, .add-output {
    display: flex;
    align-items: center;
  }

  .add-output {
    margin-left: auto;
  }

  .port input {
    background-color: var(--ayva-background-dark);
    padding-left: 5px;
    width: 50px;
  }

  .port input[disabled] {
    opacity: 0.25;
  }

  .toggle-connection {
    margin-left: 10px;
    padding: 0 10px;
    border: none;
  }

  .toggle-connection.listen {
    background-color: var(--ayva-button-primary-color);
  }

  .toggle-connection.listen:hover {
    background-color: var(--ayva-button-primary-color-hover);
  }

  .toggle-connection.listen:active:not([disabled]) {
    background-color: var(--ayva-button-primary-color-active);
  }

  .ayva-dropdown-input label {
    cursor: pointer;
  }

  .output-table {
    background-color: var(--ayva-background-medium-dark);
  }

  .output-table .header, .outputs {
    display: grid;
    grid-template-columns: 1fr 200px 112px 1fr;
    grid-row-gap: 10px;
    padding-top: 10px;
  }

  .output-table .header > * {
    text-align: center;
    color: var(--ayva-text-color-light-gray);
  }

  .outputs {
    overflow: auto;
  }

  .outputs .enabled {
    grid-column: 1;
    justify-content: center;
  }

 .outputs .delete {
    justify-content: center;
  }

  .outputs .name, .outputs .status {
    color: var(--text-color);
    opacity: 0.5;
  }

  .outputs > * {
    display: flex;
    align-items: center;
  }

  label {
    padding: 0 5px;
  }

  .delete .icon {
    color: var(--ayva-color-error);
  }

  .name > * {
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .footer {
    color: var(--ayva-text-color-light-gray);
    display: flex;
    align-items: center;
    padding-left: 10px;
  }

  .patreon-icon, .support a {
    color: rgb(255, 66, 77);
  }

  .patreon-icon .icon {
    width: 16px;
  }

  .support {
    display: flex;
    align-items: center;
    font-size: 12px;
    color: rgb(176, 176, 176);
    opacity: 0.75;
    margin-left: auto;
    padding-right: 12px;
  }
</style>
