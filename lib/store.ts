export const globalStore = {
    interventionId: null as string | number | null,

    setId(id: string | number) {
        this.interventionId = id;
    },

    getId() {
        return this.interventionId;
    },

    clear() {
        this.interventionId = null;
    }
};
