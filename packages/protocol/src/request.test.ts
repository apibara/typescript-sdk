import { v1alpha2 } from './proto'
import { TestFilter } from './proto/testing'
import { StreamDataRequest } from './request'

describe('RequestBuilder', () => {
  it('returns the final request', () => {
    const filter = new TestFilter({
      num: 123,
      text: 'abcdef',
    })

    const request = StreamDataRequest.create()
      .withBatchSize(10)
      .withFilter(TestFilter.encode(filter).finish())
      .withFinality(v1alpha2.DataFinality.DATA_STATUS_FINALIZED)
      .encode()

    expect(request.batchSize).toBe(10)
    expect(request.filter).toBeInstanceOf(Buffer)
    expect(request.filter?.length).toBe(10)

    // make ts happy
    if (!request.filter || typeof request.filter == 'string') {
      throw new Error('undefined filter')
    }

    const back = TestFilter.decode(request.filter)
    expect(back.num).toBe(123)
    expect(back.text).toBe('abcdef')
  })
})
