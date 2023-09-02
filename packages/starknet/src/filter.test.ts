import { FieldElement } from "./felt";
import { Filter } from "./filter";

describe("Filter", () => {
  describe("addHeader", () => {
    it("sets the header field", () => {
      const filter = Filter.create().withHeader().toObject();

      expect(filter.header).toEqual({});
    });
  });

  describe("addTransaction", () => {
    it("accepts a builder or callback function", () => {
      const filter = Filter.create()
        .addTransaction(
          Filter.transaction()
            .declare()
            .withClassHash(FieldElement.fromBigInt(123)),
        )
        .addTransaction((tx) =>
          tx
            .deployAccount()
            .withConstructorCalldata([FieldElement.fromBigInt(0)]),
        )
        .toObject();

      expect(filter.transactions).toHaveLength(2);
      expect(filter.transactions?.[0].declare).toBeDefined();
      expect(filter.transactions?.[1].deployAccount).toBeDefined();
    });
  });

  describe("addEvent", () => {
    it("accepts a builder or callback function", () => {
      const filter = Filter.create()
        .addEvent(
          Filter.event().withFromAddress(FieldElement.fromBigInt("0x0")),
        )
        .addEvent((ev) => ev.withData([FieldElement.fromBigInt(0)]))
        .toObject();

      expect(filter.events).toHaveLength(2);
    });
  });

  describe("addMessage", () => {
    it("accepts a builder or callback function", () => {
      const filter = Filter.create()
        .addMessage(Filter.message().withToAddress(FieldElement.fromBigInt(0)))
        .addMessage((msg) => msg.withPayload([FieldElement.fromBigInt(0)]))
        .toObject();

      expect(filter.messages).toHaveLength(2);
    });
  });

  describe("withStateUpdate", () => {
    it("accepts a callback function", () => {
      const filter = Filter.create()
        .withStateUpdate((s) => s)
        .toObject();
      expect(filter.stateUpdate).toBeDefined();
    });

    it("accepts a builder", () => {
      const filter = Filter.create()
        .withStateUpdate(Filter.stateUpdate())
        .toObject();
      expect(filter.stateUpdate).toBeDefined();
    });

    describe("addStorageDiff", () => {
      it("accepts a callback function", () => {
        const filter = Filter.create()
          .withStateUpdate((s) =>
            s.addStorageDiff((d) => d).addStorageDiff((d) => d),
          )
          .toObject();
        expect(filter.stateUpdate?.storageDiffs).toHaveLength(2);
      });
    });

    describe("addDeclaredContract", () => {
      it("accepts a callback function", () => {
        const filter = Filter.create()
          .withStateUpdate((s) =>
            s.addDeclaredContract((d) => d).addDeclaredContract((d) => d),
          )
          .toObject();
        expect(filter.stateUpdate?.declaredContracts).toHaveLength(2);
      });
    });

    describe("addDeployedContract", () => {
      it("accepts a callback function", () => {
        const filter = Filter.create()
          .withStateUpdate((s) =>
            s.addDeployedContract((d) => d).addDeployedContract((d) => d),
          )
          .toObject();
        expect(filter.stateUpdate?.deployedContracts).toHaveLength(2);
      });
    });

    describe("addDeclaredClass", () => {
      it("accepts a callback function", () => {
        const filter = Filter.create()
          .withStateUpdate((s) =>
            s.addDeclaredClass((d) => d).addDeclaredClass((d) => d),
          )
          .toObject();
        expect(filter.stateUpdate?.declaredClasses).toHaveLength(2);
      });
    });

    describe("addReplacedClass", () => {
      it("accepts a callback function", () => {
        const filter = Filter.create()
          .withStateUpdate((s) =>
            s.addReplacedClass((d) => d).addReplacedClass((d) => d),
          )
          .toObject();
        expect(filter.stateUpdate?.replacedClasses).toHaveLength(2);
      });
    });

    describe("addNonceUpdated", () => {
      it("accepts a callback function", () => {
        const filter = Filter.create()
          .withStateUpdate((s) =>
            s.addNonceUpdate((d) => d).addNonceUpdate((d) => d),
          )
          .toObject();
        expect(filter.stateUpdate?.nonces).toHaveLength(2);
      });
    });
  });
});
