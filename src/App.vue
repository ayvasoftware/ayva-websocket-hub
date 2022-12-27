<template>
  <div class="lil-gui container">
    <div class="toolbar" />
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
          Port must be a number between 1 and 65535.
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
    <div class="outputs" />
    <div class="footer" />
  </div>
</template>

<script>

export default {
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
    };
  },

  computed: {
    portInvalid () {
      const port = Number(this.port);
      return !(Number.isFinite(port) && port >= 1 && port <= 65535);
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

  mounted () {

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
        this.state = 'Listening';
      } else {
        this.state = 'Disconnected';
      }
    },

    selectOutput () {

    },
  },
};
</script>

<style scoped>
  .toolbar {
    -webkit-app-region: drag;
    background-color: black;
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

  .outputs {
    /* border-top: 1px groove var(--ayva-background-medium); */
    background-color: var(--ayva-background-medium);
  }

  label {
    padding: 0 5px;
  }
</style>
